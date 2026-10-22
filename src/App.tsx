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
import { useHeroScenes } from "./data/useHeroScenes";
import { useShowroomStories } from "./data/useShowroomStories";
import { useVehicles } from "./data/useVehicles";

type ScheduleState = { open: boolean; carId?: string };

export default function App() {
  const { cars, categories, featured, loading, error, reload } = useVehicles();
  const { scenes: heroScenes } = useHeroScenes();
  const { stories: showroomStories } = useShowroomStories();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [schedule, setSchedule] = useState<ScheduleState>({ open: false });

  const openSchedule = (carId?: string) => {
    setSelectedCar(null);
    setSchedule({ open: true, carId: carId ?? featured?.id });
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header onSchedule={() => openSchedule()} />

      <main>
        <Hero
          featuredCar={featured}
          heroScenes={heroScenes}
          onSchedule={() => openSchedule()}
          onViewCar={setSelectedCar}
        />
        <Catalog
          cars={cars}
          categories={categories}
          loading={loading}
          error={error}
          onViewCar={setSelectedCar}
          onSchedule={() => openSchedule()}
          onRetry={reload}
        />
        <Showroom stories={showroomStories} onSchedule={() => openSchedule()} />
        <Financing onSchedule={() => openSchedule()} />
        <SellCar onSchedule={() => openSchedule()} />
        <Testimonials />
        <Experience onSchedule={() => openSchedule()} />
        <Faq onSchedule={() => openSchedule()} />
      </main>

      <Footer onSchedule={() => openSchedule()} />

      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onSchedule={() => openSchedule(selectedCar.id)}
        />
      )}

      {schedule.open && (
        <ScheduleModal
          cars={cars}
          initialCarId={schedule.carId}
          onClose={() => setSchedule({ open: false })}
        />
      )}
    </div>
  );
}
