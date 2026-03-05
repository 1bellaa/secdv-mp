import axios from "axios";

const http = axios.create({
	baseURL: "https://edureview.onrender.com",
	headers: {
		"Access-Control-Allow-Origin": "*",
	}
})

export default http;