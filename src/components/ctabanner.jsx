import { Link } from "react-router-dom";
export default function CTABanner() {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-6 text-center text-black">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Explore?
        </h2>
        <p className="text-lg mb-6">
          Join us today and unlock access to everything we have in store.
        </p>
        <a
          href="/signin" 
          className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300"
        >
          Sign In to Continue
        </a>
      </div>
    </section>
  );
}
