# Administración de inscripciones

El menú «Acceso del personal» abre `/Administracion.html`. El estado se guarda en un Durable Object de Cloudflare; las inscripciones empiezan habilitadas para conservar la disponibilidad anterior.

## Activación inicial (una sola vez)

1. Publicar estos cambios. Wrangler crea automáticamente el almacenamiento `EnrollmentControl` con su migración SQLite.
2. En Cloudflare, abrir Workers & Pages → cnjec-web → Settings → Bindings → Add → Secrets Store.
3. En **Variable name**, escribir `ENROLLMENT_SETUP_KEY`. En **Secret name**, crear `CNJEC_ENROLLMENT_SETUP_KEY` con permiso **Workers** y pegar una clave aleatoria privada de al menos 32 caracteres. Seleccionar ese secreto en el binding.
4. Pulsar **Deploy** para guardar el binding.
5. Abrir `/Administracion.html`. Completar nombre, usuario, contraseña (mínimo 12 caracteres) y esa clave para crear la primera cuenta de dirección.
6. Una vez creada la primera cuenta, la activación se bloquea automáticamente. Se puede quitar el secreto de Cloudflare.
7. Iniciar sesión y crear cuentas individuales para la directora y/o el personal administrativo. Entregar las contraseñas en privado.

## Permisos

- Dirección: abrir/cerrar inscripciones, crear cuentas y quitar acceso a otras personas.
- Personal administrativo: abrir/cerrar inscripciones.
- Visitantes: acceder al contrato solo cuando las inscripciones están habilitadas.

Las sesiones vencen en ocho horas. Quitar una cuenta revoca sus sesiones. Las contraseñas se guardan como hashes PBKDF2 con sal individual; la cookie de sesión es HttpOnly, Secure y SameSite Strict. Hay límite de intentos de acceso y comprobación del origen de las operaciones. No se guardan datos de estudiantes en este almacenamiento.

Cuando se cierran las inscripciones, el servidor bloquea el PDF y sus campos incluso mediante enlace directo. La página revisa el estado cada 20 segundos y antes de generar una descarga. Un archivo ya descargado queda en poder de su destinatario.

## Actualizar o recuperar cuentas

Una cuenta de dirección puede quitar una cuenta y crearla de nuevo con otra contraseña. No puede eliminar su propia cuenta. Conviene tener dos cuentas de dirección para poder recuperar el acceso entre ambas. Si se pierden todas las credenciales, el propietario deberá recuperar una cuenta desde el almacenamiento de Cloudflare; la clave de activación no permite reemplazar cuentas existentes.

Este cambio incorpora el control de apertura y cierre. La carga de nuevas versiones del contrato requiere una ampliación posterior.

## Formulario de contacto de las familias

El formulario visible encima del contrato en Inicio envía una consulta a `cnjec699@hotmail.com`, con copia a `cnjec699@gmail.com`, mediante FormSubmit. Solicita datos básicos del tutor y del futuro alumno; todos los campos visibles y la autorización de contacto son obligatorios. No confirma ni registra una inscripción.

Para activarlo una sola vez:

1. Publicar los cambios y abrir Inicio → Inscripciones → Formulario de contacto.
2. Completar y enviar una consulta de prueba autorizada. El navegador abre la verificación antispam del servicio antes de terminar el envío.
3. Revisar `cnjec699@hotmail.com`, incluida la carpeta de spam, y confirmar el mensaje de activación de FormSubmit.
4. Confirmar que la consulta llegue también a `cnjec699@gmail.com` como copia. Revisar la carpeta de spam en ambas cuentas si no aparece.

Las consultas quedan pendientes de entrega hasta activar el destinatario. FormSubmit conserva las consultas durante 30 días según su documentación. El consentimiento del formulario informa a las familias de este procesamiento. No se guardan los campos en el almacenamiento del sitio ni se envían al completar el contrato PDF. El formulario de consultas está disponible aunque las inscripciones estén cerradas.

No se enviaron correos reales durante las comprobaciones de desarrollo. Cambiar el destinatario principal requiere activar de nuevo el formulario. Documentación: https://formsubmit.co/documentation y https://formsubmit.co/help.

## Desarrollo local del control de inscripciones

Usar `npx wrangler dev`; un servidor de archivos estáticos no tiene las rutas API necesarias. Para desarrollo local, reemplazar temporalmente el binding de Secrets Store por `ENROLLMENT_SETUP_KEY` en `.dev.vars` (excluido del repositorio y de los archivos públicos).
