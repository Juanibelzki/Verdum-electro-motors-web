import { useState } from "react";
import Catalog from "./components/Catalog";
import CarDetailModal from "./components/CarDetailModal";
import Experience from "./components/Experience";
import Financing from "./components/Financing";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import SellCar from "./components/SellCar";
import ScheduleModal from "./components/ScheduleModal";
import Showroom, { Faq } from "./components/Showroom";
import Testimonials from "./components/Testimonials";
import type { Car } from "./data/cars";

type ScheduleState = { open: boolean; carId?: string };

export default function App() {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [schedule, setSchedule] = useState<ScheduleState>({ open: false });
  const [financePreset, setFinancePreset] = useState<{ price: number; nonce: number } | null>(
    null
  );

  const openSchedule = (carId?: string) => {
    setSelectedCar(null);
    setSchedule({ open: true, carId });
  };

  const openFinancing = (price: number) => {
    setSelectedCar(null);
    setFinancePreset({ price, nonce: Date.now() });
    window.setTimeout(() => {
      document.getElementById("financiacion")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header onSchedule={() => openSchedule()} />

      <main>
        <Hero onSchedule={() => openSchedule()} onViewCar={setSelectedCar} />
        <Catalog onViewCar={setSelectedCar} onSchedule={() => openSchedule()} />
        <Experience onSchedule={() => openSchedule()} />
        <Financing onSchedule={() => openSchedule()} presetPrice={financePreset} />
        <SellCar onSchedule={() => openSchedule()} />
        <Testimonials />
        <Showroom onSchedule={() => openSchedule()} />
        <Faq onSchedule={() => openSchedule()} />
      </main>

      <Footer onSchedule={() => openSchedule()} />

      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onSchedule={() => openSchedule(selectedCar.id)}
          onFinance={openFinancing}
        />
      )}

      {schedule.open && (
        <ScheduleModal
          initialCarId={schedule.carId}
          onClose={() => setSchedule({ open: false })}
        />
      )}
    </div>
  );
}
