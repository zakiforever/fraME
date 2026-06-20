import Header from "@/app/Header";
import DemoCard from "@/app/DemoCard";

const DEMO_STORY = {
  headline: "Vantaa makes decicion on schools: burqa ban",
  url: "https://www.is.fi/kotimaa/art-2000011869140.html",
  date: new Date("2025-03-14"),
  sources: ["Ilta-Sanomat"],
  articles: [
    {
      title: "Vantaa makes decicion on schools: burqa ban",
      url: "https://www.is.fi/kotimaa/art-2000011869140.html",
      date: new Date("2025-03-14"),
      source: "Ilta-Sanomat",
    },
  ],
};

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Demo</h1>
          <p className="text-sm text-gray-400 mt-1">
            Esimerkki siitä, miten yksittäinen uutinen näkyy asiantuntijakommentteineen ja taustatietoineen.
          </p>
        </div>
        <DemoCard group={DEMO_STORY} />
      </div>
    </div>
  );
}
