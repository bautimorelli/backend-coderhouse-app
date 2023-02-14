import { logger } from "../logger/logger.js"

export const routeLogger = (req, res, next) => {
    logger.info(`Accedida la ruta ${req.route.path} mediante el metodo ${req.route.stack[0].method}`)
    next()
}
