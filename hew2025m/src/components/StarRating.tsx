import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating?: number; // Nota de 0 a 5. Se não passar, gera aleatório
  showCount?: boolean; // Mostrar o número de avaliações? (ex: 120 reviews)
}

export default function StarRating({ rating, showCount = true }: StarRatingProps) {
  // Se não tiver nota, finge uma nota alta (entre 3.5 e 5.0) para ficar bonito
  const displayRating = rating || (Math.floor(Math.random() * (50 - 35) + 35) / 10);
  const reviewCount = rating ? 15 : Math.floor(Math.random() * 200) + 10; // Número fake de reviews

  // Lógica para desenhar as estrelas
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Estrela Cheia
        stars.push(<Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        // Meia Estrela (Simulada visualmente ou usando ícone específico se tiver)
        // O lucide-react padrão as vezes não tem StarHalf preenchido perfeito, então usamos Star com cor parcial se necessário
        // Aqui vou usar StarHalf se disponível ou Star com cor diferente
        stars.push(<StarHalf key={i} size={16} className="text-yellow-400 fill-yellow-400" />);
      } else {
        // Estrela Vazia
        stars.push(<Star key={i} size={16} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{renderStars()}</div>
      <span className="font-bold text-gray-700 ml-1">{displayRating.toFixed(1)}</span>
      {showCount && <span className="text-xs text-gray-500">({reviewCount})</span>}
    </div>
  );
}