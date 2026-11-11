import {
  loadCart,
  getDiscount,
  getFee,
  calculateTotal,
  getCart,
  updateItemQuantity,
  removeCartItem,
  findInCart,
} from "./cart.js";

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
  discountTextRef = discountRef?.previousElementSibling;
  if (discountTextRef) discountTextRef.textContent += ` (-${getDiscount()}%)`;

  feeRef = document.getElementById("cart-fee");
  if (feeRef) feeRef.textContent = `$${getFee()}`;

  productListElem = document.getElementById("cart-products");
  cartContentSection = document.getElementById("cart-content-section");
  emptyCartContentSection = document.getElementById("empty-cart-section");
  cartTitle = cartContentSection.previousElementSibling;

  loadCart((cartData) => {
    updateTotalUI();
    updateCartDOM(cartData);
  });
});

const updateTotalUI = () => {
  const totals = calculateTotal();

  if (subtotalRef) subtotalRef.textContent = `$${totals.subtotal}`;
  if (discountRef) discountRef.textContent = `-$${totals.discount}`;
  if (totalRef) totalRef.textContent = `$${totals.total}`;
};

const handleQuantityChange = (productId, quantity = 1, override = false) => {
  const result = updateItemQuantity(productId, quantity, override);
  if (!result) return;

  updateTotalUI();
  updateCartDOM(getCart());

  if (result.removed) {
    alert(`${result.existingProduct.title} removed from cart!`);
  } else {
    alert(`${result.existingProduct.title}'s quantity changed!`);
  }
};

const handleRemoveItem = (productId) => {
  const removedProduct = removeCartItem(productId);

  updateTotalUI();
  updateCartDOM(getCart());
  if (removedProduct) {
    alert(`${removedProduct.title} removed from cart!`);
  }
};

const updateCartDOM = (products) => {
  if (productListElem && products.length) {
    cartContentSection.classList.remove("d-none");
    if (cartTitle) cartTitle.classList.remove("d-none");
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
    if (cartTitle) cartTitle.classList.add("d-none");
    emptyCartContentSection.classList.remove("d-none");
  }

  //* Bind DOM Event Listeners
  const quantityMinusRefs = document.querySelectorAll("#quantity-minus");
  quantityMinusRefs.forEach((minus) => {
    minus.addEventListener("click", (e) =>
      handleQuantityChange(e.currentTarget.dataset.id, -1),
    );
    const productFound = findInCart(minus.dataset.id);
    if (productFound) {
      minus.disabled = productFound.quantity <= 1;
    }
  });

  const quantityPlusRefs = document.querySelectorAll("#quantity-plus");
  quantityPlusRefs.forEach((plus) =>
    plus.addEventListener("click", (e) =>
      handleQuantityChange(e.currentTarget.dataset.id, 1),
    ),
  );

  const quantityInputRefs = document.querySelectorAll("#quantity");
  quantityInputRefs.forEach((input) =>
    input.addEventListener("change", (e) => {
      const newQuantity = parseInt(e.currentTarget.value);
      if (!newQuantity || newQuantity < 0) {
        input.value = findInCart(e.currentTarget.dataset.id).quantity;
        return;
      }
      handleQuantityChange(e.currentTarget.dataset.id, newQuantity, true);
    }),
  );

  const cartRemoveRefs = document.querySelectorAll("#cart-remove");
  cartRemoveRefs.forEach((remove) =>
    remove.addEventListener("click", (e) => {
      handleRemoveItem(e.currentTarget.dataset.id);
    }),
  );
};
