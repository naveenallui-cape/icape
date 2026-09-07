import { AboutSection } from "@/components/public/about-section";
import { GallerySection } from "@/components/public/gallery-section";
import { HomeCards } from "@/components/public/home-cards";
import { TestimonialsSection } from "@/components/public/testimonials-section";

export default function HomePage() {
  return (
    <>
      <HomeCards />
      <GallerySection />
      <TestimonialsSection />
      <AboutSection />
    </>
  );
}
