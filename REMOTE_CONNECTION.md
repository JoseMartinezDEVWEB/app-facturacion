# Conexión Remota - Manual de Usuario

## Introducción

La funcionalidad de conexión remota permite a los usuarios con roles de **administrador** y **superadministrador** acceder al sistema desde dispositivos y ubicaciones remotas, facilitando la gestión del negocio desde cualquier lugar.

## Características Principales

- **Modo Local**: Conexión a un servidor instalado en la red local.
- **Modo Nube**: Conexión a un servidor alojado en la nube.
- **Configuración Flexible**: Posibilidad de alternar entre ambos modos según necesidades.
- **Información del Sistema**: Visualización de información técnica del servidor.
- **Seguridad**: Acceso limitado solo a usuarios con permisos adecuados (admin y superadmin).

## Requisitos

1. Tener una cuenta con rol de administrador o superadministrador.
2. Para modo local: Servidor ejecutándose en la red local.
3. Para modo nube: Servidor configurado en un servicio de hosting con dirección IP pública o dominio.
4. Dispositivo con navegador web o aplicación móvil instalada.

## Configuración Inicial

### Configuración del Servidor Local

1. Instale la aplicación en el servidor principal.
2. Inicie el servidor:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. El servidor mostrará las direcciones IP disponibles para conexión local:
   ```
   Server running on port 4500
   Local: http://localhost:4500
   Available on your network:
     http://192.168.1.100:4500
   ```
4. Tome nota de la dirección IP local para configurar la conexión remota.

### Configuración del Servidor en la Nube

1. Despliegue la aplicación en su proveedor de servicios cloud (AWS, Azure, Google Cloud, Heroku, etc.).
2. Configure las variables de entorno necesarias:
   - `REMOTE_ACCESS_USER`: Usuario para acceso remoto.
   - `REMOTE_ACCESS_PASSWORD`: Contraseña para acceso remoto.
   - `JWT_SECRET`: Clave secreta para tokens JWT.
3. Obtenga la URL pública del servidor.

## Alternativas para Acceso Remoto

### Opción 1: Acceso Directo por IP y Puerto

Si desea acceder desde fuera de su red local:

1. Configure el reenvío de puertos en su router:
   - Acceda a la interfaz de administración de su router (generalmente 192.168.0.1 o 192.168.1.1)
   - Busque la sección "Port Forwarding" o "Reenvío de puertos"
   - Cree una regla para redirigir el puerto 4500 a la IP local de su servidor
2. Obtenga su IP pública (busque "mi ip" en Google)
3. Acceda mediante: `http://[su-ip-pública]:4500`

### Opción 2: Usar Localtunnel (Recomendado para pruebas)

Localtunnel es una herramienta que permite exponer su servidor local a Internet sin configurar el router:

1. Instale Localtunnel:
   ```bash
   npm install -g localtunnel
   ```

2. Inicie el servidor y luego ejecute:
   ```bash
   lt --port 4500 --subdomain facturacion-app
   ```

3. Recibirá una URL pública como: `https://facturacion-app.loca.lt`
4. Para la conexión remota use: `https://facturacion-app.loca.lt/api`

#### Integración Automatizada

Para mayor comodidad, puede usar el script integrado:

```bash
cd backend
npm run tunnel
```

Este comando iniciará tanto el servidor como el túnel y mostrará la URL para acceso remoto.

### Opción 3: Dominio Personalizado

Para una solución más profesional:

1. Compre un dominio (GoDaddy, Namecheap, etc.)
2. Configure un registro A que apunte a su IP pública
3. Configure el reenvío de puertos en su router
4. Acceda a través de `http://sudominio.com:4500`
5. Para la conexión remota use: `http://sudominio.com:4500/api`

### Opciones Adicionales

Si las alternativas anteriores no funcionan para su caso, considere:

- **Cloudflare Tunnel**: Seguro y sin necesidad de abrir puertos
- **Pagekite**: Servicio freemium con buena estabilidad
- **Serveo**: Basado en SSH, sin instalación requerida
- **LocalXpose**: Interfaz web para gestionar túneles

## Uso de la Función de Conexión Remota

### Acceso a la Configuración

1. Inicie sesión en la aplicación con una cuenta de administrador o superadministrador.
2. En el menú lateral, haga clic en la opción "Conexión Remota".

### Configuración de Modo Local

1. En la pantalla de configuración, active el interruptor "Modo Local".
2. Ingrese la URL del servidor local en el formato: `http://192.168.1.100:4500/api`.
3. Haga clic en "Conectar".
4. El sistema se conectará al servidor local y mostrará un mensaje de confirmación.

### Configuración de Modo Nube

1. En la pantalla de configuración, desactive el interruptor "Modo Local" para usar "Modo Nube".
2. Ingrese la URL del servidor en la nube en el formato: `https://su-dominio.com/api` o la URL de Localtunnel: `https://facturacion-app.loca.lt/api`.
3. Haga clic en "Conectar".
4. El sistema se conectará al servidor en la nube y mostrará un mensaje de confirmación.

## Solución de Problemas

### No Puedo Conectarme al Servidor Local

1. Verifique que el servidor esté en ejecución.
2. Compruebe que está conectado a la misma red WiFi/LAN que el servidor.
3. Verifique que no hay un firewall bloqueando el puerto 4500.
4. Pruebe usar la dirección IP en lugar de localhost.

### No Puedo Conectarme al Servidor en la Nube

1. Verifique su conexión a internet.
2. Compruebe que la URL del servidor es correcta y está actualizada.
3. Verifique que el servidor esté operativo (puede probar accediendo desde un navegador).
4. Consulte con el administrador del sistema para verificar credenciales y permisos.

### Problemas con Localtunnel

1. Si recibe un error de autenticación al usar Localtunnel, pruebe con una alternativa como Cloudflare Tunnel o Serveo.
2. Si el subdominio deseado no está disponible, deje que el sistema asigne uno aleatorio o pruebe con otro nombre.
3. Si la conexión se interrumpe, reinicie el comando de Localtunnel.

## Preguntas Frecuentes

### ¿Puedo usar ambos modos de conexión?

Sí, puede alternar entre el modo local y el modo nube según sus necesidades. Sin embargo, solo puede estar activo un modo a la vez.

### ¿Es segura la conexión remota?

La conexión utiliza autenticación mediante tokens JWT y, en el caso de conexiones remotas, puede utilizar HTTPS para cifrar los datos. Además, solo los usuarios con permisos de administrador tienen acceso a esta funcionalidad.

### ¿Qué dispositivos puedo usar para la conexión remota?

Puede usar cualquier dispositivo con un navegador web moderno o la aplicación móvil específica si está instalada.

### ¿Necesito configuración adicional en mi router para el modo local?

Si desea acceder al servidor local desde fuera de su red (a través de Internet), necesitará configurar el reenvío de puertos (port forwarding) en su router. Consulte el manual de su router o contacte a su proveedor de servicios de Internet para obtener ayuda con esta configuración.

### ¿Las URL de Localtunnel son permanentes?

No, las URL generadas por Localtunnel cambian cada vez que reinicia el servicio. Para URLs permanentes, considere usar un dominio propio o un servicio como Cloudflare Tunnel.

---

Para más información o soporte técnico, contacte al administrador del sistema. 