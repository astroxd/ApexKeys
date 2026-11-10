import { addToCart } from "./cart.js";

const ProductTypes = ["keyboards", "keycaps", "switches"];
const ProductSortOptions = [
  {
    value: "A-Z",
    label: "Alphabetically: A-Z",
  },
  {
    value: "Z-A",
    label: "Alphabetically: Z-A",
  },
  {
    value: "price-asc",
    label: "Price: Low to High",
  },
  {
    value: "price-desc",
    label: "Price: High to Low",
  },
];

let products = [];
let query = "";
let sort = ProductSortOptions[0].value;

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  buildPage();
});

const buildPage = () => {
  const navbarSearchForm = document.getElementById("navbar-search-form");
  navbarSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  let timeout;
  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", (e) => {
    query = e.target.value.trim();
    clearTimeout(timeout);
    timeout = setTimeout(filterProducts, 500);
  });

  const productFilter = document.getElementById("filterProducts");

  ProductTypes.forEach((pType, index) => {
    const inputHtml = `<div class="form-check mb-2">
                    <input
                      class="form-check-input"
                      type="radio"
                      id=${pType}
                      value=${pType}
                      name="product"
                      ${!index ? "checked" : ""}
                    />
                    <label
                      class="form-check-label small"
                      for=${pType}
                      >${pType.charAt(0).toUpperCase() + pType.slice(1)}</label>
                  </div>`;
    productFilter.innerHTML += inputHtml;
  });

  const options = productFilter.querySelectorAll("input") ?? [];
  for (const option of options) {
    option.addEventListener("change", (e) => {
      if (e.target.checked) {
        loadData(e.target.value);
      }
    });
  }

  const sortSelect = document.getElementById("sort-select");
  ProductSortOptions.forEach((sortOption, index) => {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", sortOption.value);
    if (index === 0) newOption.selected = true;
    newOption.text = sortOption.label;
    sortSelect.appendChild(newOption);
  });

  sortSelect.addEventListener("input", (e) => {
    sort = e.target.value;
    filterProducts();
  });

  loadInfoModal();
};

const loadData = async (category = "keyboards") => {
  if (!ProductTypes.includes(category)) return;

  const xmlPath = `../xml/${category}.xml`;
  $.ajax({
    url: xmlPath,
    dataType: "xml",
    success: (result) => {
      parseXML(result);
      filterProducts();
    },
    error: (err) => {
      console.log(err);
    },
  });
};

const parseXML = (xml) => {
  let xmlProducts = $(xml).find("product");

  products = xmlProducts
    .map((_, p) => {
      const $p = $(p);
      let product = {
        id: parseInt($p.find("> id").text()),
        type: $p.find("> type").text() ?? "",
        vendor: $p.find("> vendor").text() ?? "",
        available: $p.find("> available").text() === "true",
        rating: parseFloat($p.find("> rating").text()) ?? 0,
        ratingCount: parseInt($p.find("> rating_count").text()) ?? 0,
        title: $p.find("> title").text() ?? "",
        price:
          parseFloat(
            $p.find("> price").text().slice(1).replace(",", ".") ?? 0,
          ) ?? 0,
        description: [],
        images: [],
      };

      const description = [];

      $p.find("> description > *").each((_, el) => {
        const $el = $(el);
        const tagName = el.tagName;

        if (tagName === "list") {
          const items = [];
          $el.find("item").each((_, item) => {
            items.push($(item).text());
          });
          description.push({
            type: tagName,
            items,
          });
        } else if (tagName === "div") {
          description.push({
            type: tagName,
            content: $el.text(),
          });
        }
      });

      const images = [];
      $p.find("> images > image").each((_, img) => {
        const $img = $(img);
        images.push({
          src: $img.attr("src"),
          alt: $img.attr("alt"),
        });
      });

      product["description"] = description;
      product["images"] = images;

      return product;
    })
    .get();
};

const filterProducts = () => {
  const lowerQuery = query.toLowerCase();
  const filteredProducts = products
    .filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(lowerQuery);
      const vendorMatch = p.vendor.toLowerCase().includes(lowerQuery);
      const descriptionMatch = p.description.some((d) => {
        if (d.type === "div") {
          return d.content.toLowerCase().includes(lowerQuery);
        } else if (d.type === "list") {
          return d.items.some((item) =>
            item.toLowerCase().includes(lowerQuery),
          );
        }
        return false;
      });

      return titleMatch || vendorMatch || descriptionMatch;
    })
    .toSorted((a, b) => {
      // localeCompare funziona con le lettere accentate (è, é, à)
      switch (sort) {
        case "A-Z":
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        case "Z-A":
          return b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });

  updateDOM(filteredProducts);
};

const updateDOM = (products = []) => {
  const row = document.getElementById("products");
  if (row) {
    row.innerHTML = "";

    if (products.length <= 0) {
      const noFoundText = `<div class="col text-center text-muted">${query.length ? `No element found for: "${query}"` : "No elements"}</div>`;
      row.innerHTML = noFoundText;
      return;
    }

    for (const product of products) {
      const newProd = `<div class="col-md-6 col-lg-3">
            <div class="card">
              <img
                src=${product.images[0].src}
                alt=${product.title}
                class="card-img-top"
              />
              <div class="card-body">
                <h5 class="card-title mb-0 ellipsis">${product.title}</h5>
                <p class="card-text text-accent fw-semibold mb-0 small">${product.vendor}</p>
                <p class="card-text text-muted mb-0 card-description ellipsis">
                  ${product.description.find((d) => d.type === "div")?.content ?? product.description.find((d) => d.type === "list").items}
                </p>
                <div class="d-flex align-items-center justify-content-between">
                  <span class="text-accent card-price">$${product.price}</span>
                  <span class="badge bg-primary" style="font-size: 0.6em;">${product.available ? "" : "Sold out"}</span>
                  </div>
                <div
                  class="d-flex flex-row flex-lg-column gap-2 align-items-center justify-content-between card-buttons"
                >
                  <button
                    class="btn btn-primary w-100"
                    data-bs-toggle="modal"
                    data-bs-target="#cartModal1"
                    data-id=${product.id}
                    id="add-to-cart-btn"
                  >
                    Add To Cart
                  </button>
                  <button
                    class="btn btn-outline-primary w-100"
                    data-id=${product.id}
                    id="info-btn"
                  >
                    More details
                  </button>
                </div>
              </div>
            </div>
          </div>`;

      row.innerHTML += newProd;
    }
    const addButtons = row.querySelectorAll("#add-to-cart-btn");
    addButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = parseInt(e.currentTarget.dataset.id);
        const productFound = products.find((p) => p.id === productId);
        if (productFound) {
          addToCart(getCartProduct(productFound));
        }
      });
    });

    const infoButtons = row.querySelectorAll("#info-btn");
    infoButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = parseInt(e.currentTarget.dataset.id);
        const productFound = products.find((p) => p.id === productId);
        if (productFound) {
          buildInfoModal(productFound);
        }
      });
    });
  }
};

const loadInfoModal = () => {
  const $infoModal = $("#info-modal")[0];
  const infoModal = document.getElementById("info-modal");
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) {
      closeInfoModal();
    }
  });
  $infoModal.on("keydown", (e) => {
    if (e.key === "Escape") {
      closeInfoModal();
    }
  });

  const closeButtons = infoModal.querySelectorAll("[data-bs-dismiss='modal']");
  closeButtons.forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      closeInfoModal();
    });
  });

  const quantityMinusRef = infoModal.querySelector("#quantity-minus");
  const quantityPlusRef = infoModal.querySelector("#quantity-plus");
  const quantityInputRef = infoModal.querySelector("#quantity");
  quantityMinusRef.addEventListener("click", (e) => {
    quantityMinusRef.disabled =
      parseInt(quantityInputRef.value) <= 1 ? true : false;
    if (quantityInputRef.value <= 1) return;
    quantityInputRef.value -= 1;
  });

  quantityPlusRef.addEventListener("click", (e) => {
    quantityInputRef.value = parseInt(quantityInputRef.value) + 1;
    quantityMinusRef.disabled =
      parseInt(quantityInputRef.value) <= 1 ? true : false;
  });
  quantityInputRef.addEventListener("change", (e) => {
    const newQuantity = parseInt(e.currentTarget.value);
    quantityInputRef.value = newQuantity > 0 ? newQuantity : 1;
    quantityMinusRef.disabled =
      parseInt(quantityInputRef.value) <= 1 ? true : false;
  });
};

const buildInfoModal = (product) => {
  const infoModal = document.getElementById("info-modal");

  const modalTitle = infoModal.querySelector(".modal-title");
  modalTitle.textContent = product.title;

  const modalImg = infoModal.querySelector("img");
  modalImg.src = product.images[0].src;
  modalImg.alt = product.images[0].alt ?? product.title;

  const modalDescription = infoModal
    .querySelector(".modal-description")
    .querySelector("div");
  modalDescription.innerHTML = "";

  product.description.forEach((desc) => {
    if (desc.type === "div") {
      const p = document.createElement("p");
      p.classList.add("text-muted", "small", "mb-3");
      p.innerHTML = desc.content;
      modalDescription.appendChild(p);
    } else if (desc.type === "list") {
      const ul = document.createElement("ul");
      ul.classList.add("text-muted", "small", "ps-3", "mb-3");
      desc.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      modalDescription.appendChild(ul);
    }
  });

  const modalPrice = infoModal.querySelector("#price");
  modalPrice.textContent = `$${product.price}`;

  const addToCartButton = infoModal.querySelector("#info-modal-add-to-cart");
  const quantityInputRef = infoModal.querySelector("#quantity");
  addToCartButton.addEventListener("click", (e) => {
    addToCart(getCartProduct(product), quantityInputRef.value ?? 1);
  });

  openInfoModal();
};

// TODO use jquery
const openInfoModal = () => {
  const infoModal = document.getElementById("info-modal");
  infoModal.style.display = "block";
  infoModal.classList.add("show");
  infoModal.setAttribute("aria-hidden", "false");
  infoModal.setAttribute("role", "dialog");
  infoModal.focus();

  const body = document.querySelector("body");
  body.classList.add("modal-open");
  body.style.overflow = "hidden";
  body.style.paddingRight = "0px";

  const backdropDiv = document.createElement("div");
  backdropDiv.classList.add("modal-backdrop", "fade", "show");
  body.appendChild(backdropDiv);
};

const closeInfoModal = () => {
  const infoModal = document.getElementById("info-modal");
  infoModal.style.display = "none";
  infoModal.classList.remove("show");
  infoModal.setAttribute("aria-hidden", "true");
  infoModal.removeAttribute("role");
  infoModal.blur();

  const body = document.querySelector("body");
  body.classList.remove("modal-open");
  body.style.removeProperty("overflow");
  body.style.removeProperty("padding-right");

  const backdropDiv = document.querySelector(".modal-backdrop");
  if (backdropDiv) backdropDiv.remove();
};

const getCartProduct = (product) => {
  const cartProduct = {
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.images[0],
  };
  return cartProduct;
};
