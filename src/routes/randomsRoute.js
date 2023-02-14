import express from "express"
import {fork} from "child_process"
import { routeLogger } from "../middleware/routeLogger.js"

const randomsRoute = express.Router()

randomsRoute.get("/randoms", routeLogger, (req, res) => {
    const child = fork("./src/scripts/randomsChild.js")
    const cant = req.query.cant || 100000000
    child.on("message", (childMsg)=>{
        if (childMsg == "ready") {
            child.send("start " + cant)
        } else {
            res.send(childMsg)
        }
    })
})

export { randomsRoute }
