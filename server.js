const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressSession = require('express-session');
const expressHandlebars = require('express-handlebars');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const dbURL = "mongodb://localhost:27017";
const dbConfig = { useNewUrlParser: true, useUnifiedTopology: true, family: 4 };
const dbName = "proyectoinv";
const app = express();
const multer = require('multer');
const csvjson = require('csvjson');
const readFile = require('fs').readFile;
const port = 4000;


app.engine('handlebars', expressHandlebars({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layout')
}));
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'));

app.use(expressSession({
    secret: 'Session',
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'files'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

const upload = multer({
    storage: storage
})


app.get('/', (req, res) => {
    console.log('GET /');
    if (req.session.user) {
        checkUserEdit(req.session.user, result => {
            if (result) {
                res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false });
            } else {
                checkUserAdmin(req.session.user, result => {
                    if (result) {
                        res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true });
                    } else {
                        res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false });
                    }
                });
            }
        });
    } else {
        res.render('login', { title: 'Iniciar sesión' });
    }
});


app.post('/login', (req, res) => {
    console.log('POST /login', req.body);
    if (req.body.user && req.body.password) {
        checkUser(req.body.user, req.body.password, result => {
            if (result) {
                req.session.user = req.body.user;
                searchResults(data => {
                    if (data) {
                        checkUserEdit(req.session.user, result => {
                            if (result) {
                                res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, listaResultados: data  });
                            } else {
                                checkUserAdmin(req.session.user, result => {
                                    if (result) {
                                        res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, listaResultados: data });
                                    } else {
                                        res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, listaResultados: data  });
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                req.session.destroy();
                res.render('login', { tltle: 'Iniciar sesión', mensaje: 'Usuario o clave incorrectos.', tipo: 'mensaje-error' });
            }
        });
    } else {
        req.session.destroy();
        res.render('login', { title: 'Iniciar sesión', mensaje: 'Ingrese usuario y clave', tipo: 'mensaje-error' });
    }
});


app.get('/home', (req, res) => {
    console.log('GET /home');

    if (req.session.user) {
        searchResults(data => {
            if (data) {
                checkUserEdit(req.session.user, result => {
                    if (result) {
                        res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, listaResultados: data  });
                    } else {
                        checkUserAdmin(req.session.user, result => {
                            if (result) {
                                res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, listaResultados: data });
                            } else {
                                res.render('home', { title: 'Reportes', header: 'Reportes', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, listaResultados: data  });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.render('login', { title: 'Iniciar sesión' });
    }
});


app.get('/registrar', (req, res) => {
    console.log('GET /registrar');
    if (req.session.user) {
        checkUserEdit(req.session.user, result => {
            if (result) {
                res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false });
            } else {
                checkUserAdmin(req.session.user, result => {
                    if (result) {
                        res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true });
                    } else {
                        res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false });
                    }
                });
            }
        });
    } else {
        res.render('login', { title: 'Iniciar sesión' });
    }
});


app.post('/registrar', (req, res) => {
    console.log('POST /registrar', req.body);
    if (req.body.name && req.body.lastname && req.body.username && req.body.mail && req.body.password && (req.body.edit || req.body.admin) && req.body.passwordRep) {
        if (req.body.password == req.body.passwordRep) {
            registerUser(req.body.name, req.body.lastname, req.body.username, req.body.mail, req.body.password, req.body.edit, req.body.admin, result => {
                if (result) {
                    checkUserEdit(req.session.user, result => {
                        if (result) {
                            res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, mensaje: 'Usuario registrado existosamente.', tipo: 'mensaje-exito' });
                        } else {
                            checkUserAdmin(req.session.user, result => {
                                if (result) {
                                    res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, mensaje: 'Usuario registrado existosamente.', tipo: 'mensaje-exito' });
                                } else {
                                    res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, mensaje: 'Usuario registrado existosamente.', tipo: 'mensaje-exito' });
                                }
                            });
                        }
                    });
                } else {
                    checkUserEdit(req.session.user, result => {
                        if (result) {
                            res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, mensaje: 'Datos incompletos', tipo: 'mensaje-error' });
                        } else {
                            checkUserAdmin(req.session.user, result => {
                                if (result) {
                                    res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, mensaje: 'Datos incompletos', tipo: 'mensaje-error' });
                                } else {
                                    res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, mensaje: 'Datos incompletos', tipo: 'mensaje-error' });
                                }
                            });
                        }
                    });

                }
            });
        } else {
            checkUserEdit(req.session.user, result => {
                if (result) {
                    res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, mensaje: 'La contraseña debe ser la misma.', tipo: 'mensaje-error' });
                } else {
                    checkUserAdmin(req.session.user, result => {
                        if (result) {
                            res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, mensaje: 'La contraseña debe ser la misma.', tipo: 'mensaje-error' });
                        } else {
                            res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, mensaje: 'La contraseña debe ser la misma.', tipo: 'mensaje-error' });
                        }
                    });
                }
            });
        }
    } else {
        checkUserEdit(req.session.user, result => {
            if (result) {
                res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, mensaje: 'Debe completar el formulario para registrarse.', tipo: 'mensaje-error' });
            } else {
                checkUserAdmin(req.session.user, result => {
                    if (result) {
                        res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, mensaje: 'Debe completar el formulario para registrarse.', tipo: 'mensaje-error' });
                    } else {
                        res.render('register', { title: 'Registrar', header: 'Registrar nuevo usuario', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, mensaje: 'Debe completar el formulario para registrarse.', tipo: 'mensaje-error' });
                    }
                });
            }
        });
    }
});


app.get('/conteos', (req, res) => {
    console.log('GET /conteos');

    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        if (!err) {
            const colFiles = client.db(dbName).collection("files");

            colFiles.find().toArray((err, files) => {
                client.close();
                if (req.session.user) {
                    checkUserEdit(req.session.user, result => {
                        if (result) {
                            res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, listaFiles: files });
                        } else {
                            checkUserAdmin(req.session.user, result => {
                                if (result) {
                                    res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, listaFiles: files });
                                } else {
                                    res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, listaFiles: files });
                                }
                            });
                        }
                    });
                } else {
                    res.render('login', { title: 'Iniciar sesión' });
                }
            });
        }
    });
});


app.get('/gestionar', (req, res) => {
    console.log('GET /gestionar');

    if (req.session.user) {
        checkUserEdit(req.session.user, result => {
            if (result) {
                MongoClient.connect(dbURL, dbConfig, (err, client) => {
                    if (!err) {
                        const colUsuarios = client.db(dbName).collection("users");

                        colUsuarios.find().toArray((err, usuarios) => {
                            client.close();

                            res.render('manage', { title: 'Gestionar usuarios', header: 'Gestionar Usuarios', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, listaUsuarios: usuarios });
                        });

                    }
                });
            } else {
                checkUserAdmin(req.session.user, result => {
                    if (result) {
                        MongoClient.connect(dbURL, dbConfig, (err, client) => {
                            if (!err) {
                                const colUsuarios = client.db(dbName).collection("users");

                                colUsuarios.find().toArray((err, usuarios) => {
                                    client.close();

                                    res.render('manage', { title: 'Gestionar usuarios', header: 'Gestionar Usuarios', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, listaUsuarios: usuarios });
                                });

                            }
                        });
                    } else {
                        MongoClient.connect(dbURL, dbConfig, (err, client) => {
                            if (!err) {
                                const colUsuarios = client.db(dbName).collection("users");

                                colUsuarios.find().toArray((err, usuarios) => {
                                    client.close();

                                    res.render('manage', { title: 'Gestionar usuarios', header: 'Gestionar Usuarios', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, listaUsuarios: usuarios });
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.render('login', { title: 'Iniciar sesión' });
    }
});


app.post('/conteos', upload.single('file'), (req, res) => {

    console.log('POST /conteos');

    if (req.file) {

        importResults(req.file.path);

        MongoClient.connect(dbURL, dbConfig, (err, client) => {
            if (!err) {
                const colFiles = client.db(dbName).collection("files");

                colFiles.insertOne({ name: req.file.filename.substr(0, 9), file: req.file.filename, path: req.file.path.substr(63, 20) });

                colFiles.find().toArray((err, files) => {
                    client.close();
                    if (req.session.user) {
                        checkUserEdit(req.session.user, result => {
                            if (result) {
                                res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: true, puedeAdministrar: false, listaFiles: files });
                            } else {
                                checkUserAdmin(req.session.user, result => {
                                    if (result) {
                                        res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: true, puedeAdministrar: true, listaFiles: files });
                                    } else {
                                        res.render('cyclecounts', { title: 'Conteos', header: 'Conteos', nombre: req.session.user, puedeEditar: false, puedeAdministrar: false, listaFiles: files });
                                    }
                                });
                            }
                        });
                    } else {
                        res.render('login', { title: 'Iniciar sesión' });
                    }

                });
            }
        });
    }




});


app.get('/logout', (req, res) => {
    console.log("GET /logout");
    req.session.destroy();
    res.render('login', { title: 'Iniciar sesión' });
});


app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`)
});


//////verifica si existe el usuario y si la contraseña es correcta, devuelve un dato booleano //////
function checkUser(usr, pwd, callback) {
    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        if (!err) {
            const proyectodb = client.db(dbName);
            const colUsuarios = proyectodb.collection('users');

            colUsuarios.findOne({ username: usr, password: pwd }, (err, data) => {
                client.close();
                if (data) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        } else {
            callback(false);
        }
    });
}


///// Verifica si el usuario cuya sesion esta iniciada tiene permisos de Administrador /////
function checkUserAdmin(usr, callback) {
    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        if (!err) {
            const proyectodb = client.db(dbName);
            const colUsuarios = proyectodb.collection('users');

            colUsuarios.findOne({ username: usr, editar: true, administrar: true }, (err, data) => {
                client.close();
                if (data) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        }
    });
}


///// Verifica si el usuario cuya sesion esta iniciada tiene permisos de Edicion /////
function checkUserEdit(usr, callback) {
    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        if (!err) {
            const proyectodb = client.db(dbName);
            const colUsuarios = proyectodb.collection('users');

            colUsuarios.findOne({ username: usr, editar: true, administrar: false }, (err, data) => {
                client.close();
                if (data) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        }
    });
}


////// Guarda datos de nuevo usuario en la base de Datos //////
function registerUser(name, lastname, usr, mail, pwd, edit, admin, callback) {
    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        if (!err) {
            const colUsuarios = client.db(dbName).collection("users");

            if (edit == 'on') {
                edit = true;
            } else {
                edit = false;
            }
            if (admin == 'on') {
                admin = true;
            } else {
                admin = false;
            }

            colUsuarios.insertOne({ name: name, lastname: lastname, username: usr, mail: mail, password: pwd, editar: edit, administrar: admin });
            client.close();
            callback(true);
        }
    });
}


////// Convierte archivos CSV a JSON para despues guardarlos en la base de datos //////
function importResults(csv) {
    readFile(csv, 'utf-8', (err, fileContent) => {
        if (err) {
            console.log(err);
        } else {
            const jsonObj = csvjson.toObject(fileContent);

            MongoClient.connect(dbURL, dbConfig, (err, client) => {
                if (!err) {
                    const colResults = client.db(dbName).collection("results");
                    colResults.insertMany(jsonObj);
                }
            });
        }
    });
}


////// Consulta en la base de datos todos los resultados ya cargados //////
function searchResults(callback) {
    MongoClient.connect(dbURL, dbConfig, (err, client) => {
        const colResults = client.db(dbName).collection("results");
        colResults.find().toArray((err, data) => {
            client.close()
            if (data) {
                callback(data);
            }
        });
    });
}