import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; 
import MouseAnimation from "../components/MouseAnimation";

export default function Signup() {

  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit =async (e) => {
    e.preventDefault();
    console.log("Sign up data:", form);
     const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
   if (error){
    alert('Problem don dey ooooooooo. try again e fit be network'+ error.message)
    return 
   }
    alert("redirecting to the sexy provider. wait a bit honey");
    navigate("/dashboard");
  
  };


  const handlegoogleSignup =async()=>{
    await supabase.auth.signInWithOAuth({provider: "google"})

    if (error){
      alert('Problem don dey ooooooooo. try again e fit be network')
    }else{
      alert('redirecting to the sexy provider. wait a bit honey')
    }
  }
 

  return (
    <div className="min-h-screen flex w-full gap-10 items-center justify-center bg-gray-50 ">
      <div className="hidden lg:flex h-120 mw-md items-center w-80 justify-center flex-col">
          <MouseAnimation/>
      </div>
      <div className="bg-blue-200 shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 border-none focus:outline-none"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg border-none focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-none rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
          />

          <button
            type="submit"
            // onClick={sucess}
            className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            Sign Up
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
             onClick={handlegoogleSignup}
          className="w-full flex items-center border justify-center border-b-gray-600 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          <img
            src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
            alt="Google logo"
            className="w-15 h-5 mr-2 "
          />
          Sign up with Google
        </button>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-700 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
