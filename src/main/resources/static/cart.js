let cart = [];
const DISCOUNT = 10;
const FEE = 20;

let subtotalRef;
let discountRef;
let discountTextRef;
let feeRef;
let totalRef;

let productListElem;
let cartContentSection;
let emptyCartContentSection;
let cartTitle;

document.addEventListener("DOMContentLoaded", () => {
  subtotalRef = document.getElementById("cart-subtotal");
  totalRef = document.getElementById("cart-total");

  discountRef = document.getElementById("cart-discount");
  discountTextRef = discountRef.previousElementSibling;
  if (discountTextRef) {
    discountTextRef.textContent += ` (-${DISCOUNT}%)`;
  }
  feeRef = document.getElementById("cart-fee");
  feeRef.textContent = `$${FEE}`;

  productListElem = document.getElementById("cart-products");
  cartContentSection = document.getElementById("cart-content-section");
  emptyCartContentSection = document.getElementById("empty-cart-section");
  cartTitle = cartContentSection.previousElementSibling;

  loadCart();
});

const loadCart = () => {
  const xmlPath = "../xml/cart.xml";
  $.ajax({
    url: xmlPath,
    dataType: "xml",
    success: (result) => {
      parseXML(result);
      updateTotal();
      updateCartDOM(cart);
    },
    error: (err) => {
      console.log(err);
    },
  });

  // const cartProducts = JSON.parse(localStorage.getItem("apexkeys_cart"));
  // if (cartProducts) {
  //   cart = cartProducts;
  // }

  // updateTotal();
  // updateCartDOM(cart);
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
  const existingProduct = findInCart(product.id);

  if (existingProduct) {
    existingProduct.quantity += quantity;
  } else {
    cart.push({
      ...product,
      quantity: quantity,
    });
  }

  saveCartToLocalStorage();
};

const saveCartToLocalStorage = () => {
  localStorage.setItem("apexkeys_cart", JSON.stringify(cart));
  // localStorage.clear();
};

const getCartSubtotal = () => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

const updateTotal = () => {
  const subtotal = getCartSubtotal();
  const discount = (subtotal * DISCOUNT) / 100;
  const total = subtotal - discount + FEE;

  subtotalRef.textContent = `$${subtotal.toFixed(2)}`;
  discountRef.textContent = `-$${discount.toFixed(2)}`;
  totalRef.textContent = `$${total.toFixed(2)}`;
};

const updateQuantity = (productId, quantity = 1, override = false) => {
  const existingProduct = findInCart(productId);
  if (!existingProduct || !quantity) return;

  if (override) {
    existingProduct.quantity = quantity;
  } else {
    existingProduct.quantity += quantity;
  }
  if (existingProduct.quantity <= 0) removeFromCart(productId);

  updateTotal();
  updateCartDOM(cart);
};

const removeFromCart = (productId) => {
  cart = cart.filter((item) => item.id !== parseInt(productId));
  updateTotal();
  updateCartDOM(cart);
  saveCartToLocalStorage();
};

const updateCartDOM = (products) => {
  if (productListElem && products.length) {
    cartContentSection.classList.remove("d-none");
    cartTitle.classList.remove("d-none");
    emptyCartContentSection.classList.add("d-none");
    productListElem.innerHTML = "";

    for (const product of products) {
      const newCartProduct = `<li class="d-flex border-bottom pb-3 pt-3">
                  <div class="cart-image">
                    <img
                      src=${product.image.src}
                      alt=${product.image?.alt ?? product.title}
                      class="img-fluid rounded-3"
                    />
                  </div>
                  <div class="d-flex justify-content-between w-100 ps-2">
                    <div class="d-flex flex-column w-100">
                      <span class="fw-bold fs-5">${product.title}</span>
                      <span class="small mt-auto">Unit price: <span class="text-muted">$${product.price}</span></span>
                      <span class="fw-bold fs-4">$${(product.price * product.quantity).toFixed(2)}</span>
                    </div>
                    <div
                      class="d-flex flex-column justify-content-between align-items-end"
                    >
                      <button class="btn rounded-circle" id="cart-remove" data-id=${product.id}>
                        <re-icon icon="trash3" class="fs-5"></re-icon>
                      </button>
                      <div
                        class="d-flex rounded-1 border border-secondary cart-quantity"
                      >
                        <button class="btn" id="quantity-minus" data-id=${product.id}>-</button>
                        <input
                          type="number"
                          name="quantity"
                          id="quantity"
                          value=${product.quantity}
                          data-id=${product.id}
                        />
                        <button class="btn" id="quantity-plus" data-id=${product.id}>+</button>
                      </div>
                    </div>
                  </div>
                </li>`;
      productListElem.innerHTML += newCartProduct;
    }
  } else if (!products.length) {
    cartContentSection.classList.add("d-none");
    cartTitle.classList.add("d-none");
    emptyCartContentSection.classList.remove("d-none");
  }

  const quantityMinusRefs = document.querySelectorAll("#quantity-minus");
  quantityMinusRefs.forEach((minus) => {
    minus.addEventListener("click", (e) =>
      updateQuantity(e.currentTarget.dataset.id, -1),
    );
    const productFound = findInCart(minus.dataset.id);
    if (productFound) {
      if (productFound.quantity <= 1) {
        minus.disabled = true;
      } else {
        minus.disabled = false;
      }
    }
  });

  const quantityPlusRefs = document.querySelectorAll("#quantity-plus");
  quantityPlusRefs.forEach((plus) =>
    plus.addEventListener("click", (e) =>
      updateQuantity(e.currentTarget.dataset.id, 1),
    ),
  );

  const quantityInputRefs = document.querySelectorAll("#quantity");
  quantityInputRefs.forEach((input) =>
    input.addEventListener("change", (e) => {
      const newQuantity = parseInt(e.currentTarget.value);
      if (!newQuantity) {
        input.value = findInCart(e.currentTarget.dataset.id).quantity;
        return;
      }
      updateQuantity(e.currentTarget.dataset.id, newQuantity, true);
    }),
  );

  const cartRemoveRefs = document.querySelectorAll("#cart-remove");
  cartRemoveRefs.forEach((remove) =>
    remove.addEventListener("click", (e) => {
      removeFromCart(e.currentTarget.dataset.id);
    }),
  );
};

const findInCart = (targetId) => {
  return cart.find((item) => item.id === parseInt(targetId));
};
