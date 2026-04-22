# UpBeat

Proyecto full stack con dos carpetas principales:

- `Client` (Expo / React Native)
- `Server` (Node.js / Express / MySQL)

## Requisitos

- Node.js 18+
- npm
- MySQL 8+
- Git

## 1. Clonar el repositorio

```bash
git clone git@github.com:FloresBry/UpBeat.git
cd UpBeat
```

## 2. Instalar dependencias

```bash
cd Server
npm install
cd ..\Client
npm install
```

## 3. Configurar base de datos

Desde la carpeta `Server`, ejecutar:

```bash
mysql -u TU_USUARIO -p < schema.sql
```

Esto crea la base de datos `upBeat` y sus tablas.

## 4. Configurar variables de entorno del backend

Crear el archivo `Server/.env` con este contenido:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=upBeat
WEB_PORT=8088
```

## 5. Levantar el backend

En una terminal:

```bash
cd UpBeat/Server
npm run dev
```

## 6. Levantar el frontend

En otra terminal:

```bash
cd UpBeat/Client
npm expo start
```

Opcional:

```bash
npm run android 
npm run web
```

## Notas importantes

- En `Client/app/(tabs)/index.tsx`, `API_BASE_URL` debe apuntar al backend correcto.
- Si usas celular fisico, usa la IP local de tu PC (por ejemplo `http://192.168.x.x:8088`).
- Si usas web, valida que `origin` en `Server/app.js` coincida con la URL del frontend para CORS.
- 
---
---
---

## Diego: 7. Gestión de Recursos Visuales (Assets)

Yo añadí las piezas clave de la identidad visual en `Client/assets/images/`. Estos archivos son la base del diseño "limpio" de la app:

- `logo.png`: El nombre de la marca con su tipografía oficial.
- `cronoPesas.png`: El isotipo (cronómetro + pesas) usado como núcleo del logo.
- `lineasLanding.png`: Recurso gráfico para las esquinas diagonales.
- `defaultAvatar.jpg`: Una foto de perfil gris básica usada como marcador predeterminado.

---

## 8. Instalación de Dependencias Adicionales

Para que la interfaz y la personalización funcionen, yo integré librerías externas. Es necesario ejecutar esto en la terminal dentro de la carpeta `Client`:

``````bash
npx expo install expo-image-picker expo-linear-gradient
``````

---

## 9. Desarrollo de Vistas y Componentes (Frontend)

Configuré las pantallas principales separando la lógica visual:

- **`landingPage.tsx`** (Ubicación: `Client/components/`): Componente de bienvenida y carga. Utiliza `lineasLanding.png` con rotación de 180° y ensambla el logo principal.
- **`ProfileScreen.tsx`** (Ubicación: `Client/app/`): Interfaz de configuración. Incluye el encabezado con `LinearGradient` y la lógica para habilitar la edición de datos y envío al servidor.

---

## 10. Inyección de Lógica en `index.tsx` (Capa de Aplicación)

Para integrar mi diseño en el flujo del registro sin romper la lógica existente, yo realicé cambios específicos en `Client/app/(tabs)/index.tsx`:

**A. Importaciones iniciales:**

`````typescript
import { useState, useEffect } from 'react'; // Yo añadí useEffect
import LandingPage from '../../components/landingPage'; // Yo importé el componente
`````

**B. Estado y Temporizador:**

Añadí un estado de preparación y un efecto de 3 segundos para mostrar la identidad de la app dentro de `HomeScreen`:

````typescript
export default function HomeScreen() {
  const [isAppReady, setIsAppReady] = useState(false); // Mi estado de carga

  useEffect(() => {
    const prepararApp = async () => {
      // Yo definí una espera de 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsAppReady(true);
    };
    prepararApp();
  }, []);
`````

**C. Renderizado Condicional:**

Inserté este "interruptor" antes del `return` principal para que la pantalla de carga cubra el flujo hasta que la app esté lista:

```typescript
  // Si la app no está lista, yo devuelvo mi componente landingPage
  if (!isAppReady) {
    return <LandingPage />;
  }
```

---

## 11. Actualización de la Lógica del Servidor (`app.js`)

Modifiqué `Server/app.js` para habilitar la comunicación de actualizaciones de perfil:

- **CORS**: Actualicé los permisos para incluir el método `PUT`.
- **Endpoint**: Creé la ruta `app.put("/user/update/:id", ...)` para procesar cambios de nombre y contraseña.

---

## 12. Modificaciones en la Capa de Datos (`database.js`)

Para asegurar la persistencia en MySQL, realicé estos ajustes en `Server/database.js`:

- **Función `updateUser`**: Escribí la función encargada de ejecutar `UPDATE users SET name = ?, password = ? WHERE id = ?`.
- **Exportación**: Integré la función en el módulo para que el backend pueda realizar cambios permanentes.

---

## Resumen de Archivos Intervenidos

**Archivos nuevos:**

| Archivo | Ruta |
|---|---|
| `logo.png` | `Client/assets/images/` |
| `cronoPesas.png` | `Client/assets/images/` |
| `lineasLanding.png` | `Client/assets/images/` |
| `defaultAvatar.jpg` | `Client/assets/images/` |
| `landingPage.tsx` | `Client/components/` |
| `ProfileScreen.tsx` | `Client/app/` |

**Archivos modificados:**

| Archivo | Ruta |
|---|---|
| `index.tsx` | `Client/app/(tabs)/` |
| `app.js` | `Server/` |
| `database.js` | `Server/` |
```
