import Navbar from "./components/Navbar";

const About = () => {
	return (
		<div>
			<Navbar />
			<div className="container" style={{ maxWidth: "85%" }}>
				<h1>Packages used</h1>
				<ul>
					<li>Node</li>
					<li>React</li>
					<li>MongoDB</li>
					<li>Mongoose</li>
					<li>Axios</li>
					<li>ReactRouter</li>
					<li>JSONWebToken</li>
					<li>Bcrypt</li>
					<li>React Icons</li>
					<li>React Markdown</li>
					<li>Vite</li>
				</ul>
			</div>
		</div>
	)
}

export default About;