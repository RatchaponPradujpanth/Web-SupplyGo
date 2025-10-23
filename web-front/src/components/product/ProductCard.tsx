'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  discount?: number;
  onAddToCart?: (id: number) => void;
}

export default function ProductCard({ id, name, price, image, discount, onAddToCart }: ProductCardProps) {
  const discountedPrice = discount ? price * (1 - discount / 100) : price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(id);
    }
  };

  return (
    <Link href={`/product/${id}`} className="block bg-white rounded-card shadow-card p-3 hover:shadow-md transition">
      <div className="relative w-full aspect-square mb-2">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-card"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {discount && (
          <div className="absolute top-2 right-2 bg-accent text-white rounded-pill px-2 py-1 text-xs font-semibold">
            -{discount}%
          </div>
        )}
      </div>
      
      <h3 className="font-medium leading-tight line-clamp-2 min-h-[2.5rem]">{name}</h3>
      
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="font-semibold text-primary">
          ฿{discountedPrice.toLocaleString()}
        </span>
        {discount && (
          <span className="text-textmuted line-through text-xs">
            ฿{price.toLocaleString()}
          </span>
        )}
      </div>
      
      <button
        onClick={handleAddToCart}
        className="mt-3 w-full rounded-pill bg-primary text-white py-2 text-sm hover:bg-primary/90 transition"
      >
        Add to cart
      </button>
    </Link>
  );
}
