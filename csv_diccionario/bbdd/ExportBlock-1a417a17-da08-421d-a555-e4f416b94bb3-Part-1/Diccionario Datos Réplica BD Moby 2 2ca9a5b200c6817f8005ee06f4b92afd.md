# Diccionario Datos Réplica BD Moby 2

- **Bien_log_view**
    
    En esta vista se muestran los cambios detallados realizados a un bien.
    
    [Bien_Log_View](Bien_Log_View%202ca9a5b200c681ea9491d22ed9a5e603.csv)
    
- **Bien_View**
    
    En esta vista se encuentran los todos los bienes de todos los proyectos, junto con todas sus características (tipología, dormitorios, baños, superficies, etc)
    
    [Bien_View](Bien_View%202ca9a5b200c68169ab3fcece86a00533.csv)
    
- **Clientes_view**
    
    En esta view se encuentra la base de datos completa de clientes. Es decir todos las personas que se han contactado con la inmobiliaria por sus proyectos (hayan comprado o no, es una base completa). Además contiene todos los datos personales de cada uno.
    
    [Clientes_View](Clientes_View%202ca9a5b200c6816895a5fc33ca0e0fd1.csv)
    
- **Constante_View**
    
    En esta view se muestran las constantes registradas en la base de datos.
    
    [Constante_View](Constante_View%202ca9a5b200c681ffa06ccc5174a0995d.csv)
    
- **Contrato_Observacion_View**
    
    En esta view se muestran las observaciones de los contratos registradas en la base de datos.
    
    [Contrato_Observacion_View](Contrato_Observacion_View%202ca9a5b200c68115848ec2f9cf6f7ab3.csv)
    
- Contrato_Compareciente_View
    
    En esta view se muestran los comparecientes de los contratos registradas en la base de datos.
    
    [Contrato_Compareciente_View](Contrato_Compareciente_View%202ca9a5b200c6815ba54ceba485a37d32.csv)
    
- Contrato_log_view
    
    [Encuesta_respuesta_view](Encuesta_respuesta_view%202ca9a5b200c68152ae8bfb781c2afa7c.csv)
    
- **Contabilidad_view**
    
    En esta view se encuentran todos los datos asociados a pagos desde el punto de vista contable. Podrás determinar si ya están contabilizados, con qué estados, fecha, entre otros.
    
    [Contabilidad_view](Contabilidad_view%202ca9a5b200c6814fb754fce535382111.csv)
    
- **Contrato_view**
    
    En este view encontraremos todos los negocios o contratos que se hayan creado en la inmobiliaria. Se encuentran tanto los contratos activos como los reversados (se pueden diferenciar a través del campo ELIMINADO)
    
    [Contrato_View](Contrato_View%202ca9a5b200c6816aa568e660649c84ee.csv)
    
- **Contratos_Documentos_View**
    
    [Contratos_Documentos_View](Contratos_Documentos_View%202ca9a5b200c6819fb6d3f7797d3a86cf.csv)
    
- **Cotizacion_Descuento_view**
    
    En esta view se encuentra el detalle de los descuentos aplicados a cualquier cotización, se vincula a la view de cotización a través del id_cotización.
    
    [Cotizacion_Descuento_View](Cotizacion_Descuento_View%202ca9a5b200c68154abfcd0567bf1d840.csv)
    
- **Cotizacion_item_view**
    
    Esta view es una tabla puente entre bien_view y cotización_view. Permite vincular los bienes asociados a una cotización.
    
    [Cotizacion_Item_View](Cotizacion_Item_View%202ca9a5b200c681ccb71ee70afb69e2c2.csv)
    
- **Cotizacion_Promocion_view**
    
    En esta view se encuentra el detalle de promociones asociadas a alguna cotización. Se vincula a la tabla cotización a través de id_cotización.
    
    [Cotizacion_Promocion_View](Cotizacion_Promocion_View%202ca9a5b200c6814698c8dc116885a460.csv)
    
- **Cotizacion_view**
    
    En esta view encontramos todas las cotizaciones realizadas en el sistema (incluye cotizaciones manuales y automáticas)
    
    [Cotizacion_View](Cotizacion_View%202ca9a5b200c6818abb3ec889620aec7e.csv)
    
- **Empresa_View**
    
    En esta parte se muestra todas las empresas creadas y su información asociada a ella.
    
    [EMPRESA_VIEW](EMPRESA_VIEW%202ca9a5b200c6816ea56df464582c85a7.csv)
    
- **Encuesta_evento_view**
    
    [Encuesta_evento_view](Encuesta_evento_view%202ca9a5b200c681bc8beac044c72b7e33.csv)
    
- **Encuesta_respuesta_view**
    
    [Encuesta_respuesta_view](Encuesta_respuesta_view%202ca9a5b200c681508712f7b21f864496.csv)
    
- **Encuesta_view**
    
    [Encuesta_view](Encuesta_view%202ca9a5b200c681c08b61fb7c1931b327.csv)
    
- **Escrituracion_estado_view**
    
    [ESCRITURACION_ESTADO_VIEW](ESCRITURACION_ESTADO_VIEW%202ca9a5b200c681b1b89bd8167b9c8c39.csv)
    
- **Escrituracion_view**
    
    [ESCRITURACION_VIEW](ESCRITURACION_VIEW%202ca9a5b200c681fc9bffe68bf5d58ccc.csv)
    
- **Estados_param_view**
    
    
    [ESTADOS_PARAM_VIEW](ESTADOS_PARAM_VIEW%202ca9a5b200c681e490f0c20ff88cf8c7.csv)
    
- **Eventos_Contactos_view**
    
    En esta view podrás encontrar todos los contactos que se realizan en la plataforma, tanto los realizados en forma manual como automática. Esta view se vincula a Evento_view. Cada evento agrupa uno o varios eventos_contactos.
    
    [Eventos_Contactos_View](Eventos_Contactos_View%202ca9a5b200c681ccb8fed3189458c8b3.csv)
    
- **Eventos_view**
    
    En esta view se visualizan todos los eventos del sistema. Para considerar los eventos del módulo de prospectos, hay que relacionarla con Prospecto_configuración_tablero_view
    
    [Eventos_View](Eventos_View%202ca9a5b200c681929c4cd6f7ecae4d8d.csv)
    
- **Medio_Informacion_view**
    
    En esta view encontramos los Medios de Información parametrizados en el sistema.
    *Entiendase por Medio de Información el origen por el cuál el lead ingresó al sistema (instagram, facebook, portales, etc)
    
    [Medio_informacion_View](Medio_informacion_View%202ca9a5b200c68107883bcf8ef3713ce5.csv)
    
- **Metas_view**
    
    En esta vista podrán encontrar las metas configuradas en dicho módulo en el Gestión Comercial.
    
    [Metas_view](Metas_view%202ca9a5b200c6813496facfe1a3cc967c.csv)
    
- **Pagos_view**
    
    [Pagos_View](Pagos_View%202ca9a5b200c681868c1cd65c9b0d47fc.csv)
    
- **Proceso_Escrituracion_view**
    
    [Proceso_Escrituracion_View](Proceso_Escrituracion_View%202ca9a5b200c68111a471f1c38495c694.csv)
    
- **Proceso_escritura_view**
    
    [PROCESO_ESCRITURA_VIEW](PROCESO_ESCRITURA_VIEW%202ca9a5b200c6819380b7cc82e535b21a.csv)
    
- **~~Proceso_seguimiento_firma_log_view~~**
    
    [Proceso_seguimiento_firma_log_view](Proceso_seguimiento_firma_log_view%202ca9a5b200c681968903cc280ef347d5.csv)
    
- **Promesa_seguimiento_firma_view**
    
    [Promesa_Seguimiento_Firma_View](Promesa_Seguimiento_Firma_View%202ca9a5b200c681ccbf8fd416e5ec32f1.csv)
    
- **Promesa_view**
    
    [Promesa_View](Promesa_View%202ca9a5b200c681eeb7bdd928f4725214.csv)
    
- **Prospecto_configuracion_tablero_view**
    
    [Prospecto_Configuracion_Tablero_View](Prospecto_Configuracion_Tablero_View%202ca9a5b200c681068fb7f87b0dc33bc6.csv)
    
- **Proyectos_view**
    
    En esta tabla se describe principalmente los datos mas importantes del proyecto tales como Rut, nombre del proyecto, nombre legal del proyecto, dirección, fecha de inicio y termino, avance de obra, la tasa de interés para simulación de créditos entre otros.
    
    [Proyectos_View](Proyectos_View%202ca9a5b200c6813f8142d3098f680da0.csv)
    
- **~~Reporte_asignaciones_view~~**
    
    [Reporte_asignaciones_view](Reporte_asignaciones_view%202ca9a5b200c6817da18bc39a245bd0bd.csv)
    
- **~~Reporte_general_pagos_view~~**
    
    [Reporte_General_Pagos_View](Reporte_General_Pagos_View%202ca9a5b200c68179b5ead88ffa0720ab.csv)
    
- **Reserva_estado_view**
    
    [Reserva_Estado_View](Reserva_Estado_View%202ca9a5b200c68140bc03d2854f247957.csv)
    
- **Reversa_contabilidad_view**
    
    [Reversa_contabilidad_view](Reversa_contabilidad_view%202ca9a5b200c681618e04e0d076cd1ad8.csv)
    
- **Tipo_bien_view**
    
    En esta sección o tabla se muestra el tipo de bien que tiene nuestro proyecto, cuales son bienes principales y secundarios; además si están activos o no. Por otro lado muestra cuales corresponden a cual empresa.
    
    [Tipo_bien_view](Tipo_bien_view%202ca9a5b200c681bab384fab66093873c.csv)
    
- **Tipo_contacto_view**
    
    
    [Tipo_Contacto_View](Tipo_Contacto_View%202ca9a5b200c681b6a297d35d955a0e34.csv)
    
- **Usuario_view**
    
    [Usuario_View](Usuario_View%202ca9a5b200c681eb91ffec43809c5143.csv)