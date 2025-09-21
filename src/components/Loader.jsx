import { BarLoader } from "react-spinners";

function Loader() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center bg-[#2121216c] backdrop-blur-sm">
      <div className="flex aspect-square flex-col items-center justify-center rounded-md bg-[#ffffff69] p-6 font-noto font-semibold">
        <BarLoader color="#625aff" />
        <div className="text-sm mt-4">Loading ...</div>
      </div>
    </div>
  );
}

export default Loader;
