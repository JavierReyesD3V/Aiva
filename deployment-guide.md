# Guía de Deployment para Hostinger

## Requisitos Previos

### 1. Servicios Necesarios
- **Base de datos PostgreSQL**: Neon Database (ya configurado)
- **Hosting Node.js**: Hostinger con soporte para Node.js
- **Variables de entorno**: Configurar en el panel de Hostinger

### 2. Variables de Entorno Requeridas
```
DATABASE_URL=postgresql://[usuario]:[password]@[host]/[database]?sslmode=require
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
NODE_ENV=production
SESSION_SECRET=your-strong-session-secret
```

## Pasos de Deployment

### 1. Preparar el Código
```bash
# Instalar dependencias
npm install

# Construir la aplicación
npm run build

# Verificar que funciona localmente
npm start
```

### 2. Configurar Hostinger

#### A. Panel de Control
1. Accede a tu panel de Hostinger
2. Ve a "Node.js App" o "Website"
3. Crea una nueva aplicación Node.js

#### B. Configurar Variables de Entorno
En el panel de Hostinger, agrega:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PUBLIC_KEY`
- `NODE_ENV=production`
- `SESSION_SECRET`

### 3. Subir Archivos

#### Opción A: Git (Recomendado)
```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial deployment"

# Conectar con repositorio remoto
git remote add origin [tu-repositorio]
git push -u origin main
```

#### Opción B: FTP/SFTP
- Sube todos los archivos del proyecto
- Asegúrate de incluir `node_modules` o instalar en el servidor

### 4. Estructura de Archivos para Hostinger
```
public_html/
├── dist/
│   ├── public/          # Frontend construido
│   └── index.js         # Backend construido
├── server/
├── client/
├── shared/
├── package.json
└── node_modules/
```

### 5. Configurar package.json para Producción
- Script de inicio: `"start": "node dist/index.js"`
- Puerto: Use `process.env.PORT || 5000`

## Configuraciones Específicas

### 1. Archivo de Configuración de Hostinger (.htaccess)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.js [L]
```

### 2. Configurar CORS para Producción
El backend ya está configurado para manejar CORS correctamente.

### 3. Configurar Base de Datos
- Neon Database ya está configurado
- Solo necesitas actualizar `DATABASE_URL` en las variables de entorno

## Post-Deployment

### 1. Verificar Funcionamiento
- Accede a tu dominio
- Verifica que la aplicación carga
- Prueba el login y funcionalidades principales
- Verifica pagos de Stripe en modo live

### 2. Configurar SSL
- Hostinger incluye SSL gratuito
- Asegúrate de que esté activado

### 3. Configurar Dominio Personalizado
- En el panel de Hostinger
- Configura tu dominio personalizado
- Actualiza configuraciones de Stripe con el nuevo dominio

## Troubleshooting

### Problemas Comunes
1. **Error de módulos**: Asegúrate de que `node_modules` está instalado
2. **Variables de entorno**: Verifica que todas estén configuradas
3. **Puerto**: Hostinger asigna puertos automáticamente
4. **Base de datos**: Verifica la URL de conexión

### Logs
- Revisa los logs en el panel de Hostinger
- Usa `console.log` para debug si es necesario

## Alternativas a Hostinger

Si Hostinger no funciona bien, considera:
- **Vercel**: Excelente para aplicaciones full-stack
- **Railway**: Fácil deployment con base de datos
- **DigitalOcean App Platform**: Más control y escalabilidad
- **Heroku**: (Opción paga pero confiable)

## Contacto y Soporte
Si tienes problemas con el deployment, revisa:
1. Logs del servidor
2. Variables de entorno
3. Configuración de base de datos
4. Configuración de Stripe para producción