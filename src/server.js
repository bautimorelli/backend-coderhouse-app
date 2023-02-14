import express, { json } from "express"
import session from "express-session"
import MongoStore from "connect-mongo"
import passport from "passport"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import ParsedArgs from "minimist"
import cluster from "cluster"
import os from "os"
import __dirname from "./util.js"
import compression from "compression"
import { logger } from "./logger/logger.js"

import { Server } from "socket.io"
import { Strategy as LocalStrategy } from "passport-local"
import { options } from "./config/databaseConfig.js"
import { productRoute } from "./routes/productRouter.js"
import { authRoute } from "./routes/authRouter.js"
import { authLogin } from "./middleware/authLogin.js"
import { UserModel } from "./models/user.js"
import { FileContainer } from "./containers/fileContainer.js"
import { randomsRoute } from "./routes/randomsRoute.js"
import { routeLogger } from "./middleware/routeLogger.js"

//Config Argumentos
const argOptions = {
	alias: { p: "port", m: "modo" },
	default: { modo: "FORK", port: "8080" },
}
const argumentos = ParsedArgs(process.argv.slice(2), argOptions)
const PORT = process.env.PORT || argumentos.port
const MODO = argumentos.modo

//Express server
const app = express()
app.use(compression())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(__dirname + "/public"))

//....Template engine
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")

//Session
app.use(
	session({
		store: MongoStore.create({
			mongoUrl: options.mongoAtlas.urlSessionDatabase,
			ttl: 600,
		}),
		secret: "claveSuperHyperUltraMegaSuperSecreta",
		resave: false,
		saveUninitialized: false,
	})
)
//Passport
app.use(passport.initialize())
app.use(passport.session())

//Logica Cluster
if (MODO === "CLUSTER" && cluster.isPrimary) {
	const cpuAmount = os.cpus().length
	logger.info(`Cantidad de nucleos: ${cpuAmount}`)
	for (let index = 0; index < cpuAmount; index++) {
		cluster.fork()
	}
	cluster.on("exit", (worker) => {
		logger.info(`El proceso ${worker.process.pid} ha dejado de funcionar`)
		cluster.fork()
	})
} else {
	//Express Server
	const server = app.listen(PORT, () =>
		logger.info(
			`server listening on port ${PORT} on process ${process.pid}`
		)
	)

	//....Socket.io
	const io = new Server(server)
	const productsApi = new FileContainer("productos.json")
	const messagesApi = new FileContainer("messages.json")
	io.on("connection", async (socket) => {
		//productos
		socket.emit("products", await productsApi.getAll())
		socket.on("newProduct", async (data) => {
			await productsApi.save(data)
			io.sockets.emit("products", await productsApi.getAll())
		})

		//mensajes
		socket.emit("messagesChat", await messagesApi.getAll())
		socket.on("newMsg", async (data) => {
			await messagesApi.save(data)
			io.sockets.emit("messagesChat", await messagesApi.getAll())
		})
	})
}

//Bases de datos Usuarios
mongoose.set("strictQuery", false)
mongoose.connect(
	options.mongoAtlas.urlUsersDatabase,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	(error) => {
		if (error) logger.warn("Conexion fallida")
		logger.info("base de datos conectada correctamente")
	}
)

//Passport Strategies
passport.use(
	"signupStrategy",
	new LocalStrategy(
		{
			passReqToCallback: true,
			usernameField: "email",
		},
		(req, username, password, done) => {
			UserModel.findOne({ email: username }, (err, userFound) => {
				if (err) return done(err)
				if (userFound)
					return done(null, false, {
						message: "El usuario ya existe",
					})
				const newUser = {
					name: req.body.name,
					email: username,
					password: bcrypt.hashSync(password, 10, null),
				}
				UserModel.create(newUser, (err, userCreated) => {
					if (err)
						return done(err, null, {
							message: "Hubo un error al registrar el usuario",
						})
					return done(null, userCreated)
				})
			})
		}
	)
)

passport.use(
	"loginStrategy",
	new LocalStrategy(
		{
			usernameField: "email",
		},
		(username, password, done) => {
			UserModel.findOne({ email: username }, (err, user) => {
				if (err) return done(err)
				if (!user)
					return done(null, false, {
						message: "Usuario con ese nombre no existe",
					})
				if (!bcrypt.compareSync(password, user.password))
					return done(null, false, { message: "Contraseña invalida" })
				return done(null, user)
			})
		}
	)
)

passport.serializeUser((user, done) => {
	return done(null, user.id)
})
passport.deserializeUser((id, done) => {
	UserModel.findById(id, (error, userFound) => {
		return done(error, userFound)
	})
})

//....Endpoints
app.use("", productRoute)
app.use("", authRoute)
app.use("/api", randomsRoute)

app.get("/home", authLogin, routeLogger, (req, res) => {
	res.render("home", { user: req.user })
})

app.get("/", routeLogger, (req, res) => {
	res.redirect("/home")
})

app.get("/info", routeLogger, (req, res) => {
	const rrs = process.memoryUsage()
	const carpeta = process.cwd()
	const cpuAmount = os.cpus().length
	const info = {
		argumentosDeEntrada: argumentos,
		sistemaOperativo: process.platform,
		versionNode: process.version,
		rrs: rrs,
		pathEjecucion: process.execPath,
		processId: process.pid,
		carpetaProyecto: carpeta,
		NumeroNucleos: cpuAmount,
	}
	res.json(info)
	console.log(info)
})

app.get("*", (req, res) => {
	logger.warn(`Accedida la ruta inexistente ${req.originalUrl} mediante el metodo ${req.route.stack[0].method}`)
	res.redirect("/home")
})