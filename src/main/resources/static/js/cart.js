let cart = [];
const DISCOUNT = 10;
const FEE = 20;

export const getCart = () => cart;
export const getDiscount = () => DISCOUNT;
export const getFee = () => FEE;

export const findInCart = (targetId) => {
  return cart.find((item) => item.id === parseInt(targetId));
};

export const loadCart = (callback) => {
  const xmlPath = "../xml/cart.xml";
  $.ajax({
    url: xmlPath,
    dataType: "xml",
    success: (result) => {
      parseXML(result);
      if (callback) callback(cart);
    },
    error: (err) => {
      console.log(err);
    },
  });
};

const parseXML = (xml) => {
  let xmlCart = $(xml).find("cart_item");
  cart = xmlCart
    .map((_, c) => {
      const $c = $(c);
      let cartItem = {
        id: parseInt($c.find("> id").text()),
        title: $c.find("> title").text() ?? "",
        price: parseFloat($c.find("> price").text() ?? 0) ?? 0,
        quantity: parseInt($c.find("> quantity").text() ?? 1) ?? 1,
        image: {
          src: $c.find("> image").attr("src"),
          alt: $c.find("> image").attr("alt"),
        },
      };
      return cartItem;
    })
    .get();

  console.log(cart);
};

export const addToCart = (product, quantity = 1) => {
  alert(`${product.title}[${product.id}] added to cart`);
  // const existingProduct = findInCart(product.id);
  // if (existingProduct) {
  //   existingProduct.quantity += quantity;
  // } else {
  //   cart.push({
  //     ...product,
  //     quantity: quantity,
  //   });
  // }
};

export const updateItemQuantity = (
  productId,
  quantity = 1,
  override = false,
) => {
  const existingProduct = findInCart(productId);
  if (!existingProduct || !quantity) return;

  if (override) {
    existingProduct.quantity = quantity;
  } else {
    existingProduct.quantity += quantity;
  }
  const removed = existingProduct.quantity <= 0;
  if (removed) removeFromCart(productId);

  return { existingProduct, removed };
};

export const removeCartItem = (productId) => {
  const existingProduct = findInCart(productId);
  cart = cart.filter((item) => item.id !== parseInt(productId));
  return existingProduct;
};

const getCartSubtotal = () => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const calculateTotal = () => {
  const subtotal = getCartSubtotal();
  const discount = (subtotal * DISCOUNT) / 100;
  const total = subtotal - discount + (cart.length > 0 ? FEE : 0);

  return {
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    total: total.toFixed(2),
    discountPercentage: DISCOUNT,
    fee: FEE,
  };
};
