process.send("ready")

process.on("message", (parentMsg) => {
	const params = parentMsg.split(" ")
	if (params[0] == "start") {
		const cant = parseInt(params[1])
		const result = {}
		for (let index = 0; index < cant; index++) {
			const number = Math.floor(Math.random() * 1000) + 1
			let current = result[number]
			if (!current) {
				current = 1
			} else {
				current++
			}
			result[number] = current
		}
		process.send(result)
	}
})
