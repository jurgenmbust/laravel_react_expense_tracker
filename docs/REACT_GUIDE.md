# Cómo funciona React en este proyecto

Esta guía se concentra en React porque el backend Laravel ya te resulta familiar.

## 1. El punto de entrada

`src/main.tsx` monta `<App />` dentro del elemento `root` de `index.html`. `App.tsx` coordina los datos compartidos, las vistas y las acciones. La navegación usa un estado `page`: no hay un cambio de documento ni un enrutador adicional. El periodo y los filtros se conservan mientras cambias de vista; recargar la página vuelve al resumen del mes actual.

## 2. Estado compartido y estado del formulario

`App` guarda filtros, la vista seleccionada, el editor activo, el registro pendiente de eliminación y una revisión de datos. Los formularios guardan su propio borrador con `useState`. Así escribir en un campo no modifica un gasto guardado hasta que confirmas.

El tipo `Editor` es una unión discriminada: `kind: 'expense'` o `kind: 'category'`. TypeScript sabe qué datos existen en cada caso. Una unión con `undefined` representa que no hay un editor abierto.

## 3. Datos que bajan y acciones que suben

`App` pasa datos como `categories`, `currency` y el gasto elegido mediante props. También pasa funciones, por ejemplo `onSave`. `ExpenseForm` no decide qué URL usar: llama a `onSave(input)`. `App` decide si crear o actualizar según el editor.

En `ExpenseTable`, el botón Editar llama a `onEdit(expense)`. El padre recibe el registro y abre el formulario. Este flujo evita que cada fila mantenga una copia independiente de los datos del servidor.

## 4. Un campo controlado

En `ExpenseForm`:

```tsx
<input value={form.title} onChange={(event) => change('title', event.target.value)} />
```

`value` proviene del estado. `onChange` actualiza ese estado. `change` crea un objeto nuevo usando `{ ...current, [name]: value }`; no modifica el objeto anterior.

`event.preventDefault()` evita que enviar el formulario recargue el documento. El formulario valida el borrador, espera la respuesta de la API y se cierra solo si tiene éxito. Si falla, conserva el texto y muestra el error.

## 5. Cargar datos: useEffect y un hook propio

`useResource` recibe una función de carga y una revisión. Su efecto comienza una petición, maneja `loading/error/data` y cancela con AbortController al cambiar los filtros o desmontarse. También ignora respuestas de efectos cancelados para que una búsqueda lenta no reemplace una más reciente.

`useCallback` mantiene estable la función de carga mientras no cambian sus dependencias. Sin ello, una función nueva en cada render puede volver a disparar el efecto continuamente.

`useMemo` prepara los filtros efectivos, incluyendo la búsqueda diferida. Es una optimización de identidad/cálculo, no un lugar para enviar solicitudes.

`useDebouncedValue` espera 300 ms antes de aplicar lo escrito en la búsqueda. No modifica los filtros del servidor; controla cuándo React solicita un nuevo resultado.

## 6. Crear un gasto, de principio a fin

```text
Usuario escribe → estado local ExpenseForm
        ↓ enviar
ExpenseForm valida → onSave(input)
        ↓
App.saveExpense → expenseService.create/update
        ↓
request → fetch → proxy Vite → API Laravel → PostgreSQL
        ↓
respuesta exitosa → cerrar modal → incrementar revision
        ↓
useResource carga lista, resumen y categorías → nuevo render
```

La revisión provoca una recarga desde el servidor. Elegimos este patrón para mantener sincronizados la tabla paginada, los contadores y los totales calculados en PostgreSQL. Podríamos actualizar una lista local con `map/filter`, pero aun necesitaríamos recalcular o recargar el resumen. La recarga se hace sin recargar la página completa.

## 7. El cliente HTTP

`services/api.ts` agrega el prefijo `/api` y el encabezado `Accept: application/json`. Solo agrega Content-Type cuando hay cuerpo. `JSON.stringify(input)` convierte los datos a texto JSON. `response.json()` hace el proceso inverso.

`ApiError` conserva `errors` de Laravel para mostrar mensajes junto a los campos. Una respuesta 204 no tiene cuerpo: devolverla sin llamar a `json()` evita errores falsos al eliminar.

`services/expenses.ts` contiene las URLs y métodos. Los componentes no guardan direcciones del backend.

## 8. Listas, condiciones y claves

`expenses.map(...)` produce filas y `categories.map(...)` produce opciones/tarjetas. `key={record.id}` identifica cada registro. No usamos el índice del arreglo porque el orden puede cambiar.

Las condiciones muestran carga, errores, vacío o resultados. La aplicación no rellena los estados vacíos con datos de demostración. El resumen utiliza los mismos filtros que la lista, aunque los totales cubren todos los resultados y no solamente la página visible.

## 9. Dinero y fechas

Los montos del formulario son strings. Laravel y PostgreSQL calculan totales exactos con decimal. React utiliza Number únicamente para formatear o dibujar porcentajes. No uses aritmética de punto flotante para sumar dinero persistido.

Una fecha de gasto es `YYYY-MM-DD`, sin hora. El helper `localDate` usa el calendario local para que UTC no cambie el día. No es necesario convertir esta fecha a una zona horaria antes de guardarla.

## 10. Componentes y estilos

- `ExpenseForm` y `CategoryForm`: borradores, validación y envío.
- `ExpenseTable`: presentación y callbacks de acciones.
- `CategoryBreakdown`: barras con datos de la API.
- `Modal`: diálogo nativo, foco y cierre con Escape; el cierre se bloquea mientras se guarda.
- `Feedback`: carga, vacío, errores y formato de fechas/montos.
- `App`: coordinación; no se conecta directamente a PostgreSQL.

El CSS utiliza variables y media queries, sin una librería de estilos. En móvil se muestra un menú y las tablas anchas se desplazan dentro de su panel. Los formularios tienen labels, mensajes asociados y foco visible.

## Ejercicios sugeridos

1. Cambia la presentación de `ExpenseTable` sin tocar sus props.
2. Agrega un filtro por fecha inicial/final, extendiendo el contrato de Laravel y el estado React.
3. Agrega una notificación que distinga crear de actualizar.
4. Extrae el menú lateral a un componente que reciba `page` y `onNavigate`.
5. Agrega autenticación después de entender el flujo de datos; no mezcles gastos de varias personas sin autorización por propietario.

Los comentarios del código están en inglés y buscan explicar intención y puntos importantes. La guía y la interfaz están en español.
