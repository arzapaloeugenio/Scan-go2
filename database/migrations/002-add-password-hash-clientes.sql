-- Almacena exclusivamente el hash de la contraseña, nunca la contraseña en texto plano.
-- Se permite NULL para conservar compatibilidad con clientes sin contraseña y Google Auth.

ALTER TABLE public.cliente
ADD COLUMN IF NOT EXISTS password_hash TEXT;
