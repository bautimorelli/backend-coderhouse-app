import fs from "fs"
import path from "path"
import __dirname from "../util.js"
import { logger } from "../logger/logger.js"

class FileContainer {
	constructor(filename) {
		this.ruta = path.join(__dirname, `/files/${filename}`)
	}

	async readFile() {
		try {
			const contenido = await fs.promises.readFile(this.ruta, "utf-8")
			return JSON.parse(contenido)
		} catch (error) {
			logger.error("Error de lectura", error)
		}
	}

	async writeFile(content) {
		try {
			await fs.promises.writeFile(this.ruta, content)
		} catch (error) {
			logger.error("Error de escritura", error)
		}
	}

	async getAll() {
		try {
			if (fs.existsSync(this.ruta)) {
				const archivos = await this.readFile()
				return archivos
			} else {
				return []
			}
		} catch (error) {
			logger.error("Error al conseguir los objetos del archivo", error)
		}
	}

	async save(object) {
		try {
			if (fs.existsSync(this.ruta)) {
				const objects = await this.readFile()
				const id = objects.length + 1
				object.id = id
				objects.push(object)
				await this.writeFile(JSON.stringify(objects, null, 2))
				return id
			} else {
				object.id = 1
				await this.writeFile(JSON.stringify([object], null, 2))
				return 1
			}
		} catch (error) {
			logger.error("Error al guardar", error)
		}
	}

	async getById(id) {
		try {
			if (fs.existsSync(this.ruta)) {
				const objects = await this.readFile()
				let object = objects.find((element) => element.id == id)
				if (object == undefined) {
					object = null
				}
				return object
			} else {
				logger.error("El archivo no existe")
				return null
			}
		} catch (error) {
			logger.error("Error al conseguir por id", error)
		}
	}

	async deleteById(id) {
		try {
			if (fs.existsSync(this.ruta)) {
				const objects = await this.readFile()
				const result = objects.filter((element) => element.id != id)
				if (JSON.stringify(objects) === JSON.stringify(result)) {
					return -1
				}
				//Reordeno los id
				if (result.length > 0) {
					let count = 1
					result.forEach((element) => {
						element.id = count
						count++
					})
				}
				await this.writeFile(JSON.stringify(result, null, 2))
			} else {
				logger.error("El archivo no existe")
			}
		} catch (error) {
			logger.error("Error al borrar por id", error)
		}
	}

	async deleteAll() {
		try {
			await this.writeFile("[]", null, 2)
		} catch (error) {
			logger.error("Error al borrar todos", error)
		}
	}

	async updateById(id, object) {
		try {
			const objects = await this.readFile()
			let index = objects.findIndex((element) => element.id == id)
			if (index == -1) {
				return null
			}
			object.id = id
			objects[index] = object
			await this.writeFile(JSON.stringify(objects, null, 2))
			return objects
		} catch (error) {
			logger.error(error)
		}
	}
}

export { FileContainer }
