import { useState, useEffect } from "preact/hooks";
import { App, Credentials } from "realm-web";
import './index.css'

// mongodb auth
const app = new App({ id: "application-0-rbrbg" });

const Login = ({ handleLogin }) => {
    // state management
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {
        try {
            // using anonymous credentials for login
            const credentials = Credentials.anonymous();
            const anonymousUser = await app.logIn(credentials);
            console.log("Successfully logged in anonymously", anonymousUser);

            // pulling data from mongodb 
            const mongodb = anonymousUser.mongoClient("mongodb-atlas");
            const usersCollection = mongodb.db("PROJECT0").collection("user");

            // querying the collection for the username and password
            const user = await usersCollection.findOne({ username: username, password: password }); // in a real scenario, consider hashing

            if (user) {
                console.log("Login successful for user:", user.username);
                // saving username in local storage
                localStorage.setItem("loggedInUsername", username);
                window.location.href = "/event-page"; // Notify parent component of successful login
            } else {
                console.log(usersCollection);
                throw new Error("Invalid username or password.");
            }
        } catch (err) {
            console.error("Failed to log in", err);
            alert("Invalid username or password. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-400 dark:bg-slate-500 items-center justify-center">
            <div className="container mx-auto bg-slate-100 dark:bg-slate-600 flex flex-col gap-8 rounded-2xl w-1/3 h-80 justify-center items-center p-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="font-bold text-black text-2xl">Login</div>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Username"
                        className="custom-input dark:bg-slate-300"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        className="custom-input dark:bg-slate-300"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        onClick={login}
                        className="w-64 bg-blue-500 dark:bg-slate-800 text-white p-2 rounded-lg hover:bg-blue-600 transition">
                        Login
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-slate-400 w-40 text-white p-1 rounded-lg hover:bg-slate-600"
                    >
                        Back
                    </button>
                    <div className="text-center">
                        <a href="/password_recovery" className="text-sm text-blue-500 dark:text-black hover:underline">
                            Forgot your password?
                        </a>
                        <span className="mx-2 text-sm text-gray-600 dark:text-black">|</span>
                        <a href="/register" className="text-sm text-blue-500 dark:text-black hover:underline">
                            Register
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
