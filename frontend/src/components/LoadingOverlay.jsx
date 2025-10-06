import { BeatLoader } from "react-spinners";

// Define the colors and size for the spinner
const spinnerColor = "#3b82f6"; // Tailwind blue-600
const override = {
  display: "block",
  margin: "0 auto",
};

export default function LoadingOverlay() {
  return (
    // This component acts as a fixed, full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="text-center p-8 bg-white rounded-xl shadow-2xl">
        <BeatLoader 
          color={spinnerColor} 
          loading={true} 
          cssOverride={override} 
          size={15} 
          aria-label="Loading Spinner"
          data-testid="loader"
        />
        <p className="mt-4 text-lg font-semibold text-gray-700">
          Fetching your financial data...
        </p>
      </div>
    </div>
  );
}