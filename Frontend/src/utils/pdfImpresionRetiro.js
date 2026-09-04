const JSPDF_URL='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
function cargarJsPdf(){if(window.jspdf)return Promise.resolve(window.jspdf);return new Promise((ok,no)=>{const s=document.createElement('script');s.src=JSPDF_URL;s.onload=()=>ok(window.jspdf);s.onerror=()=>no(new Error('No fue posible cargar el generador PDF.'));document.head.appendChild(s);});}
function cargarImagen(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});}
function ajustarFuente(doc,texto,maxWidth,inicial,min=7){let s=inicial;doc.setFontSize(s);while(s>min&&doc.getTextWidth(texto)>maxWidth){s-=.5;doc.setFontSize(s);}return s;}
async function dibujarEscarapela(doc,img,x,y,w,h,c){
  doc.addImage(img,'PNG',x,y,w,h);
  doc.setTextColor(20,35,45);doc.setFont('helvetica','bold');doc.setFontSize(11);
  doc.text('Caminante',x+w/2,y+h*.34,{align:'center'});
  ajustarFuente(doc,c.nombre||'',w*.82,12,7);doc.text(c.nombre||'',x+w/2,y+h*.47,{align:'center'});
  doc.setFontSize(8);doc.setFont('helvetica','bold');
  doc.text(`Mesa ${c.mesa||''}`,x+w*.09,y+h*.78);
  doc.text(`Habitación ${c.habitacion||''}`,x+w*.09,y+h*.87);
}
async function dibujarHabitacion(doc,img,x,y,w,h,hab){
  doc.addImage(img,'PNG',x,y,w,h);doc.setTextColor(20,35,45);doc.setFont('helvetica','bold');
  doc.setFontSize(15);doc.text(`Habitación ${hab.habitacion||''}`,x+w/2,y+h*.25,{align:'center'});
  const ps=hab.personas||[], inicio=y+h*.40, espacio=Math.min(h*.13, (h*.48)/Math.max(ps.length,1));
  ps.forEach((p,i)=>{const yy=inicio+i*espacio;ajustarFuente(doc,p.nombre||'',w*.82,10,6);doc.text(p.nombre||'',x+w/2,yy,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text(p.tipoPersona||'',x+w/2,yy+3.3,{align:'center'});doc.setFont('helvetica','bold');});
}
async function generar(items,plantilla,tipo,nombre,individual=false){
  const {jsPDF}=await cargarJsPdf(), img=await cargarImagen(plantilla.base64), w=Number(plantilla.anchoCm)*10,h=Number(plantilla.altoCm)*10;
  const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'}), pw=210,ph=297,m=7,g=3;
  const cols=Math.max(1,Math.floor((pw-2*m+g)/(w+g))), rows=Math.max(1,Math.floor((ph-2*m+g)/(h+g))), cap=cols*rows;
  if(w>pw-2*m||h>ph-2*m)throw new Error('Las dimensiones configuradas son mayores que una página A4.');
  for(let i=0;i<items.length;i++){if(i>0&&i%cap===0)doc.addPage();const pos=i%cap,col=pos%cols,row=Math.floor(pos/cols),x=m+col*(w+g),y=m+row*(h+g);if(tipo==='escarapela')await dibujarEscarapela(doc,img,x,y,w,h,items[i]);else await dibujarHabitacion(doc,img,x,y,w,h,items[i]);}
  doc.save(nombre);
}
export const generarEscarapelasPdf=(items,p)=>generar(items,p,'escarapela','Escarapelas_Caminantes.pdf');
export const generarEscarapelaPdf=(item,p)=>generar([item],p,'escarapela',`Escarapela_${item.nombre||'Caminante'}.pdf`,true);
export const generarHabitacionesPdf=(items,p)=>generar(items,p,'habitacion','Marcacion_Habitaciones.pdf');
export const generarHabitacionPdf=(item,p)=>generar([item],p,'habitacion',`Habitacion_${item.habitacion||''}.pdf`,true);
