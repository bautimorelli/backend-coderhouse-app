import express from "express"
import passport from "passport"
import { logger } from "../logger/logger.js"
import { routeLogger } from "../middleware/routeLogger.js"

const authRoute = express.Router()

authRoute.get("/login", routeLogger, (req, res) => {
	res.render("login")
})

authRoute.post(
	"/login",
	passport.authenticate("loginStrategy", {
		failureRedirect: "/error",
		failureMessage: true,
	}), routeLogger,
	(req, res) => {
		if (req.isAuthenticated()) {
			logger.info("usuario logeado")
			res.redirect("home")
		}
	}
)

authRoute.get("/register", routeLogger, (req, res) => {
	res.render("register")
})

authRoute.post(
	"/register",
	passport.authenticate("signupStrategy", {
		failureRedirect: "/error",
		failureMessage: true,
	}), routeLogger,
	(req, res) => {
		res.redirect("/home")
	}
)

authRoute.get("/error", routeLogger, (req, res) => {
	res.render("error", {message: req.session.messages.pop()})
})

authRoute.get("/logout", routeLogger, (req, res) => {
	const user = req.user
	req.session.destroy((error) => {
		if (error) return res.send("Hubo un error al cerrar la sesion")
		res.render("logout", { user })
	})
})

export { authRoute }
