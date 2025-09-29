import { Link } from "react-router-dom";
export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/assets/video.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="absolute inset-0 bg-black/50"></div>


      <div className="relative z-10 text-center text-white px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          Welcome to <span className="text-blue-900">Finatrace</span>
        </h1>
        <p className="text-lg md:text-2xl mb-6">
          Plan your <span className="text-blue-950">Finaces</span> as you go
        </p>
        <Link to="/signin">
        <button className="px-6 py-3 bg-blue-900 hover:bg-blue-700 rounded-lg font-semibold">
          Get Started
        </button>
        </Link>
      </div>
    </section>
  );
}
