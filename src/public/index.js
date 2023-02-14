const socketClient = io()

document.getElementById("alertContainer").style.display = "block"
document.getElementById("tableContainer").style.display = "none"

//Productos......
//Productos Socket
const productsContainer = document.getElementById("productsContainer")
socketClient.on("products", (data) => {
	if (data.length != 0) {
		document.getElementById("alertContainer").style.display = "none"
		document.getElementById("tableContainer").style.display = "block"
	}
	let products = ""
	data.forEach((element) => {
		products += `<tr>
        <th scope="row" class="align-middle"> ${element.name}</th>
        <td class="align-middle">${element.price}</td>
        <td class="align-middle"><img src=${element.thumbnail} class="thumbnail"></td>
        </tr>`
	})
	productsContainer.innerHTML = products
})

//Envio formulario de producto
const productForm = document.getElementById("productForm")
productForm.addEventListener("submit", (event) => {
	event.preventDefault()
	const product = {
		name: document.getElementById("inputName").value,
		price: document.getElementById("inputPrice").value,
		thumbnail: document.getElementById("inputThumbnail").value,
	}
	socketClient.emit("newProduct", product)
})

//Chat.....
//Chat Socket
const chatContainer = document.getElementById("chatContainer")
socketClient.on("messagesChat", async (data) => {
	let messagesElements = ""
	data.forEach((element) => {
		messagesElements += `<div class="chatRow">
        <spam class="chatUsername">${element.author}</spam>&nbsp;[
        <spam class="chatDate">${element.date}</spam>]:&nbsp;
        <spam class="chatText">${element.text}</spam>
        </div>`
	})
	chatContainer.innerHTML = messagesElements
})

//Envio de mensaje chat
const chatForm = document.getElementById("chatForm")
const chatMessage = document.getElementById("messageChat")
const username = document.getElementById("username").innerHTML
chatForm.addEventListener("submit", (event) => {
	event.preventDefault()
	const message = {
		author: username,
		date: formatDate(new Date()),
		text: chatMessage.value,
	}
	socketClient.emit("newMsg", message)
	chatMessage.value = ""
})

//Funciones.....
function formatDate(date) {
	const dd = date.getDate()
	const mm = date.getMonth() + 1
	const yyyy = date.getFullYear()
	const hh = date.getHours()
	const min = date.getMinutes()
	const ss = date.getSeconds()

	const formattedDate =
		dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min + ":" + ss
	return formattedDate
}
