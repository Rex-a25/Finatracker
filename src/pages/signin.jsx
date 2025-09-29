import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; 


export default function SignIn() {
 
   const navigate = useNavigate()
  
    const [email , setEmail] = useState('')
    const [password , setPassword] = useState('')

  const handleLogin = async (e) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("You be thief: " + error.message);
  } else {
    alert(`welcome back werey`);
    console.log("User session:", data);
    navigate("/dashboard");
  }
};
   const handlegoogleSignin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/dashboard", // full URL
    },
  });

  if (error) {
    alert("Abeg try again, na network no good");
    console.log(error.message);
  }
};



                      const testLogin = async () => {
                        const { data, error } = await supabase.auth.signInWithPassword({
                          email: "test@example.com",
                          password: "password123",
                        });

                        console.log({ data, error });
                      };

                      testLogin();
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Welcome Back
        </h2>
        <form className="space-y-5"
        onSubmit={handleLogin}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <a href="/forgotpassword" className="text-sm text-blue-800 hover:underline">
              Forgot password?
            </a>
          </div>

       
          <button
          type="submit"
          // onClick={handleLogin}
          

          
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Sign In
        </button>
        </form>

 
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        
        <div className="space-y-3">
          <button
          onClick={handlegoogleSignin}
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"  alt="Google" className="w-15 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>

        {/* Sign up link */}


        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-800 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
