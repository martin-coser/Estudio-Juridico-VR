import ExcelJS from 'exceljs'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import type { Case, Client } from './types'

// Formateadores
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("es-AR")
}

const formatDateTime = (timestamp: number | undefined): string => {
  if (!timestamp) return ""
  return new Date(timestamp).toLocaleString("es-AR")
}

const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Estilos
const HEADER_STYLE = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
  }
}

const ROW_EVEN_STYLE = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } },
  alignment: { vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  }
}

const ROW_ODD_STYLE = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
  alignment: { vertical: 'middle', wrapText: true },
  border: {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  }
}

const STATUS_PAID_STYLE = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F7E3' } },
  font: { color: { argb: 'FF166534' }, bold: true }
}

const STATUS_PENDING_STYLE = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } },
  font: { color: { argb: 'FFB45309' }, bold: true }
}

// ================== CASOS ==================
export const downloadCasesBackup = async () => {
  try {
    const casesQuery = query(collection(db, "cases"), orderBy("createdAt", "desc"))
    const casesSnap = await getDocs(casesQuery)
    const cases: Case[] = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Case[]

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Estudio Jurídico - Valentina Reineri'
    workbook.created = new Date()

    // HOJA: Casos
    const casosSheet = workbook.addWorksheet('Casos')
    casosSheet.mergeCells('A1:L1')
    const titleCell = casosSheet.getCell('A1')
    titleCell.value = `BACKUP - CASOS JURÍDICOS - ${new Date().toLocaleDateString('es-AR')}`
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF111827' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    casosSheet.getRow(1).height = 30

    const headers = ['ID', 'Tipo', 'Carátula', 'Cliente', 'Expediente', 'Nombre Caso', 'Localidad', 'Tipo Proceso', 'Estado', 'Pago', 'Fecha Creación', 'Plazos/Oficios/Tareas']
    const headerRow = casosSheet.getRow(3)
    headers.forEach((header, index) => {
      headerRow.getCell(index + 1).value = header
      Object.assign(headerRow.getCell(index + 1), HEADER_STYLE)
    })
    casosSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: headers.length } }

    cases.forEach((caso, rowIndex) => {
      const row = casosSheet.getRow(4 + rowIndex)
      const isEven = rowIndex % 2 === 0
      
      row.values = [
        caso.id?.slice(0, 8) || '',
        caso.tipo || '',
        caso.caratula || '',
        caso.clienteNombre || '',
        caso.expediente || '',
        caso.nombreCaso || '',
        caso.localidad || '',
        caso.tipoProceso || '',
        caso.estado || 'Activo',
        caso.estadoPago || 'Debe',
        formatDateTime(caso.createdAt),
        `${caso.plazos?.length || 0}P / ${caso.oficios?.length || 0}O / ${caso.tareas?.length || 0}T`
      ]

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
        if (colNumber === 10) {
          Object.assign(cell, caso.estadoPago === 'Pagado' ? STATUS_PAID_STYLE : STATUS_PENDING_STYLE)
        }
        if ([11, 12].includes(colNumber)) {
          cell.alignment = { horizontal: 'center' }
        }
      })
    })

    // Ajustar anchos
    ;[10, 12, 22, 20, 16, 20, 14, 16, 10, 10, 18, 20].forEach((width, i) => {
      casosSheet.getColumn(i + 1).width = width
    })

    // HOJA: Plazos
    if (cases.some(c => c.plazos?.length)) {
      const plazosSheet = workbook.addWorksheet('Plazos')
      plazosSheet.mergeCells('A1:G1')
      plazosSheet.getCell('A1').value = `PLAZOS - Total: ${cases.reduce((sum, c) => sum + (c.plazos?.length || 0), 0)}`
      plazosSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF111827' } }
      plazosSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      plazosSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      plazosSheet.getRow(1).height = 25

      const plazosHeaders = ['Caso', 'Nombre', 'Descripción', 'Fecha', 'Cumplido', 'Días Restantes', 'ID']
      const plazosHeaderRow = plazosSheet.getRow(3)
      plazosHeaders.forEach((header, index) => {
        plazosHeaderRow.getCell(index + 1).value = header
        Object.assign(plazosHeaderRow.getCell(index + 1), HEADER_STYLE)
      })
      plazosSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 7 } }

      let plazoRowIndex = 0
      cases.forEach(caso => {
        caso.plazos?.forEach(plazo => {
          const row = plazosSheet.getRow(4 + plazoRowIndex)
          const isEven = plazoRowIndex % 2 === 0
          
          const fechaPlazo = plazo.fecha ? new Date(plazo.fecha) : null
          const hoy = new Date()
          const diasRestantes = fechaPlazo ? Math.ceil((fechaPlazo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null

          row.values = [
            (caso.nombreCaso || caso.caratula || '').slice(0, 30),
            plazo.nombre || '',
            (plazo.descripcion || '').slice(0, 40),
            plazo.fecha ? formatDate(plazo.fecha) : 'Sin fecha',
            plazo.cumplido ? '✓ Cumplido' : 'Pendiente',
            diasRestantes !== null ? (diasRestantes >= 0 ? `+${diasRestantes}` : `Vencido ${Math.abs(diasRestantes)}d`) : '-',
            plazo.id?.slice(0, 8) || ''
          ]

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
            if (colNumber === 5) {
              Object.assign(cell, plazo.cumplido ? STATUS_PAID_STYLE : STATUS_PENDING_STYLE)
            }
            if (colNumber === 6 && diasRestantes !== null && diasRestantes < 3 && !plazo.cumplido) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
              cell.font = { color: { argb: 'FFDC2626' }, bold: true }
            }
          })

          plazoRowIndex++
        })
      })

      ;[25, 20, 35, 12, 14, 14, 12].forEach((width, i) => {
        plazosSheet.getColumn(i + 1).width = width
      })
    }

    // HOJA: Oficios
    if (cases.some(c => c.oficios?.length)) {
      const oficiosSheet = workbook.addWorksheet('Oficios')
      oficiosSheet.mergeCells('A1:H1')
      oficiosSheet.getCell('A1').value = `OFICIOS - Total: ${cases.reduce((sum, c) => sum + (c.oficios?.length || 0), 0)}`
      oficiosSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF111827' } }
      oficiosSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      oficiosSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      oficiosSheet.getRow(1).height = 25

      const oficiosHeaders = ['Caso', 'Título', 'Descripción', 'Fecha Entrega', 'Estado', 'Días', 'Creado', 'ID']
      const oficiosHeaderRow = oficiosSheet.getRow(3)
      oficiosHeaders.forEach((header, index) => {
        oficiosHeaderRow.getCell(index + 1).value = header
        Object.assign(oficiosHeaderRow.getCell(index + 1), HEADER_STYLE)
      })
      oficiosSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 8 } }

      let oficioRowIndex = 0
      cases.forEach(caso => {
        caso.oficios?.forEach(oficio => {
          const row = oficiosSheet.getRow(4 + oficioRowIndex)
          const isEven = oficioRowIndex % 2 === 0
          
          const fechaEntrega = oficio.fechaEntrega ? new Date(oficio.fechaEntrega) : null
          const hoy = new Date()
          const diasRestantes = fechaEntrega ? Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null

          row.values = [
            (caso.nombreCaso || caso.caratula || '').slice(0, 30),
            oficio.titulo || '',
            (oficio.descripcion || '').slice(0, 40),
            oficio.fechaEntrega ? formatDate(oficio.fechaEntrega) : 'Sin fecha',
            oficio.entregado ? '✓ Entregado' : 'Pendiente',
            diasRestantes !== null ? (diasRestantes >= 0 ? `+${diasRestantes}` : `Vencido ${Math.abs(diasRestantes)}d`) : '-',
            formatDateTime(caso.createdAt),
            oficio.id?.slice(0, 8) || ''
          ]

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
            if (colNumber === 5) {
              Object.assign(cell, oficio.entregado ? STATUS_PAID_STYLE : STATUS_PENDING_STYLE)
            }
            if (colNumber === 6 && diasRestantes !== null && diasRestantes < 3 && !oficio.entregado) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
              cell.font = { color: { argb: 'FFDC2626' }, bold: true }
            }
          })

          oficioRowIndex++
        })
      })

      ;[25, 20, 35, 14, 14, 12, 18, 12].forEach((width, i) => {
        oficiosSheet.getColumn(i + 1).width = width
      })
    }

    // HOJA: Tareas
    if (cases.some(c => c.tareas?.length)) {
      const tareasSheet = workbook.addWorksheet('Tareas')
      tareasSheet.mergeCells('A1:H1')
      tareasSheet.getCell('A1').value = `TAREAS - Total: ${cases.reduce((sum, c) => sum + (c.tareas?.length || 0), 0)}`
      tareasSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF111827' } }
      tareasSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      tareasSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      tareasSheet.getRow(1).height = 25

      const tareasHeaders = ['Caso', 'Título', 'Descripción', 'Fecha Límite', 'Estado', 'Días', 'Creado', 'ID']
      const tareasHeaderRow = tareasSheet.getRow(3)
      tareasHeaders.forEach((header, index) => {
        tareasHeaderRow.getCell(index + 1).value = header
        Object.assign(tareasHeaderRow.getCell(index + 1), HEADER_STYLE)
      })
      tareasSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 8 } }

      let tareaRowIndex = 0
      cases.forEach(caso => {
        caso.tareas?.forEach(tarea => {
          const row = tareasSheet.getRow(4 + tareaRowIndex)
          const isEven = tareaRowIndex % 2 === 0
          
          const fechaLimite = tarea.fechaEntrega ? new Date(tarea.fechaEntrega) : null
          const hoy = new Date()
          const diasRestantes = fechaLimite ? Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null

          row.values = [
            (caso.nombreCaso || caso.caratula || '').slice(0, 30),
            tarea.titulo || '',
            (tarea.descripcion || '').slice(0, 40),
            tarea.fechaEntrega ? formatDate(tarea.fechaEntrega) : 'Sin fecha',
            tarea.entregado ? '✓ Completada' : 'Pendiente',
            diasRestantes !== null ? (diasRestantes >= 0 ? `+${diasRestantes}` : `Vencido ${Math.abs(diasRestantes)}d`) : '-',
            formatDateTime(caso.createdAt),
            tarea.id?.slice(0, 8) || ''
          ]

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
            if (colNumber === 5) {
              Object.assign(cell, tarea.entregado ? STATUS_PAID_STYLE : STATUS_PENDING_STYLE)
            }
            if (colNumber === 6 && diasRestantes !== null && diasRestantes < 3 && !tarea.entregado) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
              cell.font = { color: { argb: 'FFDC2626' }, bold: true }
            }
          })

          tareaRowIndex++
        })
      })

      ;[25, 20, 35, 14, 14, 12, 18, 12].forEach((width, i) => {
        tareasSheet.getColumn(i + 1).width = width
      })
    }

    // Descargar
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-')
    const fileName = `BACKUP - ${dateStr} - CASOS.xlsx`
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return { success: true, count: cases.length, fileName }
  } catch (error) {
    console.error('Error generando backup de casos:', error)
    throw error
  }
}

// ================== CLIENTES ==================
export const downloadClientsBackup = async () => {
  try {
    const clientsQuery = query(collection(db, "clients"), orderBy("nombre"))
    const clientsSnap = await getDocs(clientsQuery)
    const clients: Client[] = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Estudio Jurídico - Valentina Reineri'
    workbook.created = new Date()

    // HOJA: Clientes
    const clientesSheet = workbook.addWorksheet('Clientes')
    clientesSheet.mergeCells('A1:H1')
    clientesSheet.getCell('A1').value = `BACKUP - CLIENTES - ${new Date().toLocaleDateString('es-AR')}`
    clientesSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF111827' } }
    clientesSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
    clientesSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
    clientesSheet.getRow(1).height = 30

    const clientHeaders = ['ID', 'Nombre', 'Teléfono', 'Email', 'DNI/CUIT', 'Fecha Alta', 'Deudas Directas', 'Estado']
    const clientHeaderRow = clientesSheet.getRow(3)
    clientHeaders.forEach((header, index) => {
      clientHeaderRow.getCell(index + 1).value = header
      Object.assign(clientHeaderRow.getCell(index + 1), HEADER_STYLE)
    })
    clientesSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 8 } }

    clients.forEach((cliente, rowIndex) => {
      const row = clientesSheet.getRow(4 + rowIndex)
      const isEven = rowIndex % 2 === 0
      
      const deudasTotales = cliente.deudas?.length || 0
      const deudasPagadas = cliente.deudas?.filter(d => d.pagado).length || 0
      const deudasPendientes = deudasTotales - deudasPagadas

      row.values = [
        cliente.id?.slice(0, 8) || '',
        cliente.nombre || '',
        cliente.telefono || '',
        cliente.email || '',
        cliente.dni_cuit || '',
        formatDate(cliente.fechaAlta),
        deudasTotales,
        deudasPendientes > 0 ? `⚠️ ${deudasPendientes} pend.` : '✅ Al día'
      ]

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
        if (colNumber === 8 && deudasPendientes > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } }
          cell.font = { color: { argb: 'FFB45309' }, bold: true }
        }
      })
    })

    ;[10, 25, 15, 25, 15, 12, 12, 18].forEach((width, i) => {
      clientesSheet.getColumn(i + 1).width = width
    })

    // HOJA: Deudas
    if (clients.some(c => c.deudas?.length)) {
      const deudasSheet = workbook.addWorksheet('Deudas')
      deudasSheet.mergeCells('A1:F1')
      deudasSheet.getCell('A1').value = `DEUDAS - Total: ${clients.reduce((sum, c) => sum + (c.deudas?.length || 0), 0)}`
      deudasSheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF111827' } }
      deudasSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      deudasSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
      deudasSheet.getRow(1).height = 25

      const deudasHeaders = ['Cliente', 'Concepto', 'Fecha', 'Monto', 'Estado', 'Registrado']
      const deudasHeaderRow = deudasSheet.getRow(3)
      deudasHeaders.forEach((header, index) => {
        deudasHeaderRow.getCell(index + 1).value = header
        Object.assign(deudasHeaderRow.getCell(index + 1), HEADER_STYLE)
      })
      deudasSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 6 } }

      let deudaRowIndex = 0
      clients.forEach(cliente => {
        cliente.deudas?.forEach(deuda => {
          const row = deudasSheet.getRow(4 + deudaRowIndex)
          const isEven = deudaRowIndex % 2 === 0
          
          row.values = [
            cliente.nombre?.slice(0, 30) || '',
            deuda.concepto?.slice(0, 40) || '',
            formatDate(deuda.fecha),
            formatCurrency(deuda.monto),
            deuda.pagado ? '✅ Pagado' : '⚠️ Pendiente',
            formatDateTime(deuda.createdAt)
          ]

          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            Object.assign(cell, isEven ? ROW_EVEN_STYLE : ROW_ODD_STYLE)
            if (colNumber === 4) {
              cell.alignment = { horizontal: 'right' }
            }
            if (colNumber === 5) {
              Object.assign(cell, deuda.pagado ? STATUS_PAID_STYLE : STATUS_PENDING_STYLE)
            }
          })

          deudaRowIndex++
        })
      })

      ;[25, 35, 12, 15, 16, 20].forEach((width, i) => {
        deudasSheet.getColumn(i + 1).width = width
      })
    }

    // Descargar
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-')
    const fileName = `BACKUP - ${dateStr} - CLIENTES.xlsx`
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return { success: true, count: clients.length, fileName }
  } catch (error) {
    console.error('Error generando backup de clientes:', error)
    throw error
  }
}

// ================== BACKUP COMPLETO ==================
export const downloadFullBackup = async () => {
  try {
    const [casesResult, clientsResult] = await Promise.all([
      downloadCasesBackup(),
      downloadClientsBackup()
    ])

    return {
      success: true,
      casesCount: casesResult.count,
      clientsCount: clientsResult.count,
      casesFile: casesResult.fileName,
      clientsFile: clientsResult.fileName
    }
  } catch (error) {
    console.error('Error generando backup completo:', error)
    throw error
  }
}