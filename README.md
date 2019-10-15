# Proyecto de control de inventarios

Este proyecto esta hecho para ayudar a una mejor gestion de los resultados de los inventarios de cualquier negocio.
Entre sus principales funcionalidades esta el registro de usuarios, con distintos niveles de permisos (Administrar, Editar, Visualizar).

### Usuarios con permisos de Visualizacion (basico)
Son los usuarios que al iniciar sesion, solo tienen acceso a la pagina principal de Reportes.

#### Usuarios con permisos de Edicion (intermedio)
Son aquellos que pueden, ademas de visualizar reportes, cargar informacion a la base de datos de inventarios.

### Usuarios con permisos de Administarcion (alto)
Usuarios que pueden, ademas de lo mencionado anteriormente, mantener la base de datos de usuarios (es decir, registrar nuevos y editar o eliminar usuarios ya existentes).


### En conclusion:
El proyecto a la fecha (15/10/2019) se encuentra en progreso pero proximo a terminarse.

Por ultimo cabe destacar que para la realizacion de este proyecto hice uso de Express, HandleBars, MongoDB, Express-session y CSVJSON (para la conversion de archivos csv a json para luego su exportacion a MongoDB).