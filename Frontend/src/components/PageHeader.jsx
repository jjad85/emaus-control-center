import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import RefreshRounded from '@mui/icons-material/RefreshRounded';

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  onRefresh,
  loading,
}) {
  return (
    <Stack
      direction={{
        xs: 'column',
        sm: 'row',
      }}
      justifyContent="space-between"
      alignItems={{
        xs: 'stretch',
        sm: 'flex-start',
      }}
      gap={2}
      mb={3}
    >
      <Box>
        <Typography
          variant="overline"
          color="primary"
          fontWeight={800}
          sx={{
            letterSpacing: 1.1,
          }}
        >
          {eyebrow}
        </Typography>

        <Typography
          variant="h4"
          fontWeight={850}
          sx={{
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            color="text.secondary"
            mt={0.5}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {onRefresh && (
        <Button
          startIcon={
            loading
              ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              )
              : <RefreshRounded />
          }
          variant="contained"
          onClick={onRefresh}
          disabled={loading}
          sx={{
            alignSelf: {
              xs: 'flex-start',
              sm: 'center',
            },
            minHeight: 40,
            px: 2.5,
            py: 0.8,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            letterSpacing: 0.15,
            boxShadow:
              '0 7px 18px rgba(23, 59, 52, 0.22)',
            transition:
              'transform 180ms ease, box-shadow 180ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow:
                '0 11px 24px rgba(23, 59, 52, 0.28)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              boxShadow: 'none',
            },
          }}
        >
          {loading
            ? 'Actualizando...'
            : 'Actualizar'}
        </Button>
      )}
    </Stack>
  );
}
