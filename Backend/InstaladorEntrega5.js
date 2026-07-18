function instalarSprint4Entrega5() {
  asegurarHojasHistoricoMinutograma_();
  return {
    ok: true,
    mensaje: 'Hojas HistoricoRetiros e HistoricoMinutograma listas.'
  };
}

function probarSprint4Entrega5() {
  asegurarHojasHistoricoMinutograma_();
  Logger.log(JSON.stringify(obtenerComparativoRetiros({ limite: 5 }), null, 2));
}
