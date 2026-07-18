#!/bin/bash

# Diagramas de flujo en lenguaje de NEGOCIO/DOMINIO
set -e

OUT="/home/armando/Escritorio/proyectos/manoa-core/docs/diagrams-png"
mkdir -p "$OUT"

render() {
    echo "📝 $(basename $2)"
    echo "$1" > /tmp/f.mmd
    mmdc -i /tmp/f.mmd -o "${OUT}/${2}.png" -b white 2>/dev/null || echo "  ⚠️ skip"
}

echo "🚀 Creando diagramas de dominio..."
echo ""

# ============================================
# VIVIENDAS
# ============================================
echo "📁 VIVIENDAS"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano solicita crear vivienda]
    B --> C[El sistema recibe los datos]
    C --> D{¿Ya existe una vivienda con esa dirección?}
    D -->|Sí| E[El sistema indica que ya existe]
    D -->|No| F[El sistema guarda la vivienda]
    F --> G[El sistema confirma la creación]' "01-crear-vivienda"

render 'flowchart TB
    A[Inicio] --> B[Se solicitan las viviendas]
    B --> C[El sistema busca en el registro]
    C --> D[Se aplican filtros si los hay]
    D --> E[El sistema devuelve la lista]' "02-listar-viviendas"

render 'flowchart TB
    A[Inicio] --> B[Se solicita modificar una vivienda]
    B --> C[El sistema busca la vivienda]
    C --> D{¿Existe?}
    D -->|No| E[El sistema indica que no se encontró]
    D -->|Sí| F[Se reciben los nuevos datos]
    F --> G[El sistema actualiza la información]
    G --> H[El sistema confirma la actualización]' "03-editar-vivienda"

render 'flowchart TB
    A[Inicio] --> B[Se solicita eliminar una vivienda]
    B --> C[El sistema busca la vivienda]
    C --> D{¿Existe?}
    D -->|No| E[El sistema indica que no se encontró]
    D -->|Sí| F{¿Tiene familias asociadas?}
    F -->|Sí| G[No se puede eliminar, tiene dependencias]
    F -->|No| H[El sistema elimina la vivienda]
    H --> I[El sistema confirma la eliminación]' "04-eliminar-vivienda"

# ============================================
# FAMILIAS
# ============================================
echo "📁 FAMILIAS"

render 'flowchart TB
    A[Inicio] --> B[Se solicita crear una familia]
    B --> C[El sistema recibe los datos]
    C --> D{¿La vivienda existe?}
    D -->|No| E[El sistema indica que la vivienda no existe]
    D -->|Sí| F[El sistema guarda la familia]
    F --> G[El sistema vincula familia con vivienda]
    G --> H[El sistema confirma la creación]' "05-crear-familia"

render 'flowchart TB
    A[Inicio] --> B[Se solicitan las familias]
    B --> C[El sistema busca las familias]
    C --> D[Se incluye información de la vivienda]
    D --> E[El sistema devuelve la lista]' "06-listar-familias"

render 'flowchart TB
    A[Inicio] --> B[Se solicita eliminar una familia]
    B --> C[El sistema busca la familia]
    C --> D{¿Tiene ciudadanos?}
    D -->|Sí| E[No se puede eliminar]
    D -->|No| F[El sistema elimina la familia]
    F --> G[El sistema confirma]' "07-eliminar-familia"

# ============================================
# CIUDADANOS
# ============================================
echo "📁 CIUDADANOS"

render 'flowchart TB
    A[Inicio] --> B[Se solicita registrar ciudadano]
    B --> C[El sistema recibe los datos]
    C --> D[El sistema valida la cédula con el registro oficial]
    D --> E{¿La cédula es válida?}
    E -->|No| F[El sistema rechaza el registro]
    E -->|Sí| G{¿Ya existe alguien con esa cédula?}
    G -->|Sí| H[El sistema indica que ya está registrado]
    G -->|No| I[El sistema guarda al ciudadano]
    I --> J[El sistema vincula con la familia]
    J --> K[El sistema confirma el registro]' "08-crear-ciudadano"

render 'flowchart TB
    A[Inicio] --> B[Se solicitan los ciudadanos]
    B --> C[El sistema busca en el registro]
    C --> D[Se puede buscar por nombre o cédula]
    D --> E[El sistema devuelve la lista]' "09-listar-ciudadanos"

render 'flowchart TB
    A[Inicio] --> B[Se solicita eliminar un ciudadano]
    B --> C[El sistema busca al ciudadano]
    C --> D{¿Es jefe de familia?}
    D -->|Sí| E[No se puede eliminar]
    D -->|No| F[El sistema elimina al ciudadano]
    F --> G[El sistema confirma]' "10-eliminar-ciudadano"

# ============================================
# SOLICITUDES DE DOCUMENTOS
# ============================================
echo "📁 SOLICITUDES"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano solicita un documento]
    B --> C[El sistema recibe la solicitud]
    C --> D[El sistema registra como pendiente]
    D --> E[El sistema notifica al administrador]
    E --> F[El sistema confirma la solicitud]' "11-crear-solicitud"

render 'flowchart TB
    A[Inicio] --> B[El administrador revisa la solicitud]
    B --> C{¿Aprueba la solicitud?}
    C -->|Sí| D[El sistema cambia estado a aprobada]
    D --> E[El sistema genera el documento PDF]
    E --> F[El sistema agrega código de verificación]
    F --> G[El sistema guarda el documento]
    G --> H[El sistema notifica al ciudadano]
    C -->|No| I[El sistema cambia estado a rechazada]
    I --> J[El sistema registra la razón]
    J --> K[El sistema notifica al ciudadano]' "12-revisar-solicitud"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano descarga su documento]
    B --> C{¿Es dueño de la solicitud?}
    C -->|No| D[El sistema no permite la descarga]
    C -->|Sí| E{¿La solicitud está aprobada?}
    E -->|No| F[El documento aún no está listo]
    E -->|Sí| G[El sistema entrega el PDF]' "13-descargar-documento"

# ============================================
# TESORERÍA
# ============================================
echo "📁 TESORERÍA"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano registra un pago]
    B --> C[El sistema recibe los datos]
    C --> D[El ciudadano adjunta comprobante]
    D --> E[El sistema guarda el comprobante]
    E --> F[El sistema registra el pago como pendiente]
    F --> G[El sistema confirma el registro]' "14-crear-pago"

render 'flowchart TB
    A[Inicio] --> B[El tesorero revisa el pago]
    B --> C{¿El comprobante es válido?}
    C -->|Sí| D[El sistema aprueba el pago]
    D --> E[El sistema registra en contabilidad]
    C -->|No| F[El sistema rechaza el pago]
    F --> G[El sistema indica la razón]
    G --> H[El ciudadano puede corregir]' "15-revisar-pago"

render 'flowchart TB
    A[Inicio] --> B[Se consulta la transparencia]
    B --> C[El sistema calcula ingresos]
    C --> D[El sistema calcula egresos]
    D --> E[El sistema muestra el balance]
    E --> F[Cualquier ciudadano puede verlo]' "16-ver-transparencia"

render 'flowchart TB
    A[Inicio] --> B[Se solicita la tasa del día]
    B --> C[El sistema consulta el Banco Central]
    C --> D{¿Obtuvo la tasa?}
    D -->|No| E[El sistema usa la tasa anterior]
    D -->|Sí| F[El sistema actualiza la tasa]
    F --> G[El sistema muestra la tasa vigente]' "17-tasa-cambio"

# ============================================
# VOTACIONES
# ============================================
echo "📁 VOTACIONES"

render 'flowchart TB
    A[Inicio] --> B[El administrador crea una asamblea]
    B --> C[El sistema recibe los datos]
    C --> D[El sistema registra opciones de voto]
    D --> E[El sistema guarda fechas de inicio y fin]
    E --> F[La asamblea queda en estado borrador]' "18-crear-asamblea"

render 'flowchart TB
    A[Inicio] --> B[El administrador abre la votación]
    B --> C[El sistema cambia estado a abierta]
    C --> D[Los ciudadanos pueden votar]' "19-abrir-votacion"

render 'flowchart TB
    A[Inicio] --> B[Un ciudadano quiere votar]
    B --> C{¿La votación está abierta?}
    C -->|No| D[El sistema no permite votar]
    C -->|Sí| E{¿Ya votó antes?}
    E -->|Sí| F[El sistema no permite doble voto]
    E -->|No| G[El sistema registra el voto]
    G --> H[El sistema confirma el voto]' "20-emitir-voto"

render 'flowchart TB
    A[Inicio] --> B[Se cierra la votación]
    B --> C[El sistema cambia estado a cerrada]
    C --> D[El sistema cuenta los votos]
    D --> E[El sistema muestra resultados finales]' "21-cerrar-votacion"

# ============================================
# ASISTENTE IA
# ============================================
echo "📁 ASISTENTE IA"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano inicia una conversación]
    B --> C[El sistema crea una sala de chat]
    C --> D[El ciudadano escribe su pregunta]
    D --> E[El sistema recibe el mensaje]
    E --> F[El sistema consulta los datos del consejo]
    F --> G[El sistema genera una respuesta]
    G --> H[El sistema responde al ciudadano]' "22-chat-ia"

render 'flowchart TB
    A[Inicio] --> B[El ciudadano pregunta sobre datos]
    B --> C{¿Qué tipo de pregunta?}
    C -->|Cuantitativa| D[El sistema consulta estadísticas]
    C -->|Cualitativa| E[El sistema busca información]
    C -->|Documento| F[El sistema genera documento]
    D --> G[El sistema responde con números]
    E --> G
    F --> G' "23-consultar-ia"

# ============================================
# CONFIGURACIÓN
# ============================================
echo "📁 CONFIGURACIÓN"

render 'flowchart TB
    A[Inicio] --> B[Se edita el perfil del consejo]
    B --> C[El sistema recibe los datos]
    C --> D[El sistema guarda la información]
    D --> E[El sistema confirma los cambios]' "24-editar-consejo"

render 'flowchart TB
    A[Inicio] --> B[Se gestionan los firmantes]
    B --> C[Se actualiza nombre y cédula]
    C --> D[Se sube la imagen de firma]
    D --> E[El sistema guarda la firma]
    E --> F[La firma aparece en documentos]' "25-gestionar-firmantes"

echo ""
echo "✅ ¡Listo!"
ls "${OUT}"/*.png 2>/dev/null | wc -l
echo "diagramas en ${OUT}/"
