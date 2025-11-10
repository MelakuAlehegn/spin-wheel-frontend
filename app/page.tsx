import Wheel from "./components/Wheel";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-16 px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[#079964]">
          Spin the Wheel
        </h1>
        <Wheel />
      </main>
    </div>
  );
}
