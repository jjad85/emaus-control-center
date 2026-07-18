import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function KpiCard({ label, value, helper, icon }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography color="text.secondary" fontWeight={700}>{label}</Typography>
          {icon}
        </Stack>
        <Typography variant="h3" fontWeight={850} mt={1}>{value ?? 0}</Typography>
        {helper && <Typography variant="body2" color="text.secondary">{helper}</Typography>}
      </CardContent>
    </Card>
  );
}
