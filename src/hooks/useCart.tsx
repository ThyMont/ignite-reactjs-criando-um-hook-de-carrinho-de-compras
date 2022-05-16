import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock: Stock = (await api.get(`/stock/${productId}`)).data;
      const product: Product = (await api.get(`/products/${productId}`)).data;
      const index = cart.findIndex((p) => p.id === product.id);

      if (stock.amount <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (index < 0) {
        const newCart = [...cart, { ...product, amount: 1 }];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        return;
      }

      const newCart = [...cart];
      if (newCart[index].amount + 1 > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      newCart[index].amount = (newCart[index].amount || 0) + 1;
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      return;
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const index = cart.findIndex((p) => p.id === productId);
      const newCart = [...cart];

      if (index < 0) throw new Error();
      newCart.filter((product) => product.id !== productId);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }
      const stock: Stock = (await api.get(`/stock/${productId}`)).data;
      const index = cart.findIndex((p) => p.id === productId);
      const newCart = [...cart];

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      newCart[index].amount = amount;

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
