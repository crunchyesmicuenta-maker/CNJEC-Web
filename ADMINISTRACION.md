# Administración de inscripciones

El menú «Acceso del personal» abre `/Administracion.html`. El estado se guarda en un Durable Object de Cloudflare; las inscripciones empiezan habilitadas para conservar la disponibilidad anterior.

## Activación inicial (una sola vez)

1. Publicar estos cambios. Wrangler crea automáticamente el almacenamiento `EnrollmentControl` con su migración SQLite.
2. En Cloudflare, abrir Workers & Pages → cnjec-web → Settings → Variables and Secrets → Add.
3. Crear un **Secret**, nombre `ENROLLMENT_SETUP_KEY`, valor: una clave aleatoria privada de al menos 32 caracteres. Guardar y desplegar. No poner esta clave en archivos de la web, GitHub, ni en el chat.
4. Abrir `/Administracion.html`. Completar nombre, usuario, contraseña (mínimo 12 caracteres) y esa clave para crear la primera cuenta de dirección.
5. Una vez creada la primera cuenta, la activación se bloquea automáticamente. Se puede quitar el Secret de Cloudflare.
6. Iniciar sesión y crear cuentas individuales para la directora y/o el personal administrativo. Entregar las contraseñas en privado.

## Permisos

- Dirección: abrir/cerrar inscripciones, crear cuentas y quitar acceso a otras personas.
- Personal administrativo: abrir/cerrar inscripciones.
- Visitantes: acceder al contrato solo cuando las inscripciones están habilitadas.

Las sesiones vencen en ocho horas. Quitar una cuenta revoca sus sesiones. Las contraseñas se guardan como hashes PBKDF2 con sal individual; la cookie de sesión es HttpOnly, Secure y SameSite Strict. Hay límite de intentos de acceso y comprobación del origen de las operaciones. No se guardan datos de estudiantes en este almacenamiento.

Cuando se cierran las inscripciones, el servidor bloquea el PDF y sus campos incluso mediante enlace directo. La página revisa el estado cada 20 segundos y antes de generar una descarga. Un archivo ya descargado queda en poder de su destinatario.

## Actualizar o recuperar cuentas

Una cuenta de dirección puede quitar una cuenta y crearla de nuevo con otra contraseña. No puede eliminar su propia cuenta. Conviene tener dos cuentas de dirección para poder recuperar el acceso entre ambas. Si se pierden todas las credenciales, el propietario deberá recuperar una cuenta desde el almacenamiento de Cloudflare; la clave de activación no permite reemplazar cuentas existentes.

Este cambio incorpora el control de apertura y cierre. La carga de nuevas versiones del contrato requiere una ampliación posterior.

## Desarrollo local

Usar `npx wrangler dev`; un servidor de archivos estáticos no tiene las rutas API necesarias. Para probar la activación local, poner `ENROLLMENT_SETUP_KEY` en `.dev.vars` (excluido del repositorio y de los archivos públicos).
