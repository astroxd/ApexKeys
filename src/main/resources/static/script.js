import { addToCart } from "./cart.js";

const keyboardSizeCheckElements = [
  "Full-size Keyboards",
  "75% Keyboards",
  "TKL Keyboards",
];

// const ProductTypes = Object.freeze({
//   KEYBOARDS: "keyboards",
//   KEYCAPS: "keycaps",
//   SWITCHES: "switches",
// });

const ProductTypes = ["keyboards", "keycaps", "switches"];

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  let timeout;
  const searchBar = document.getElementById("search-bar");
  searchBar.addEventListener("input", (e) => {
    query = e.target.value.trim();
    clearTimeout(timeout);
    timeout = setTimeout(filterProducts, 500);
  });

  const productFilter =
    document.getElementById("filterProducts").firstElementChild;

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
        console.log(e.target.value);
        // filterProducts();
        loadData(e.target.value);
      }
    });
  }
});

let products = [];
let query = "";

const loadData = async (category = "keyboards") => {
  const apiURL = "https://dbservice.vercel.app/products";

  // const response = await fetch(apiURL);

  // if (!response.ok) {
  //   console.log(`Response status: ${response.status}`);
  //   return;
  // }

  // const data = await response.json();
  // console.log();
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
        id: $p.find("> id").text(),
        type: $p.find("> type").text(),
        vendor: $p.find("> vendor").text(),
        available: $p.find("> available").text() === "true",
        rating: parseFloat($p.find("> rating").text()) || 0,
        ratingCount: parseInt($p.find("> rating_count").text()) || 0,
        title: $p.find("> title").text(),
        price: $p.find("> price").text(),
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

  console.log(products);
};

const filterProducts = () => {
  const filteredProducts = products
    .filter((p) => {
      return (
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.vendor.includes(query.toLowerCase()) ||
        p.description.some((d) => {
          if (d.type === "div") {
            return d.content.toLowerCase().includes(query.toLowerCase());
          } else if (d.type === "list") {
            return d.items.some((item) =>
              item.toLowerCase().includes(query.toLowerCase()),
            );
          }
        })
      );
    })
    .toSorted();

  updateDOM(filteredProducts);
};

const updateDOM = (products = []) => {
  console.log("UpdatedDOm");
  const row = document.getElementById("products");

  if (row) {
    row.innerHTML = "";

    if (products.length <= 0) {
      const noFoundText = `<div>${query.length ? `No element found for: "${query}"` : "No elements"}</div>`;
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
                <p class="card-text text-accent mb-0 small">${product.vendor}</p>
                <p class="card-text text-muted mb-0 card-description ellipsis">
                  ${product.description.find((d) => d.type === "div")?.content ?? product.description.find((d) => d.type === "list").items}
                </p>
                <div class="card-rating-container">
                  <re-icon icon="star-filled"></re-icon>
                  <re-icon icon="star-filled"></re-icon>
                  <re-icon icon="star"></re-icon>
                  <re-icon icon="star"></re-icon>
                  <re-icon icon="star"></re-icon>
                </div>
                <span class="text-accent card-price">${product.price}</span>
                <div
                  class="d-flex align-items-center justify-content-between card-buttons"
                >
                  <button
                    class="btn btn-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#cartModal1"
                    data-id=${product.id}
                    id="add-to-cart-btn"
                  >
                    Add To Cart
                  </button>
                  <button
                    class="btn btn-outline-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#infoModal1"
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
        const productId = e.currentTarget.dataset.id;
        const productFound = products.find(
          (p) => p.id.toString() === productId,
        );
        if (productFound) {
          const product = {
            id: productFound.id,
            title: productFound.title,
            price: productFound.price,
            image: productFound.images[0].src,
          };
          addToCart(product);
        }
      });
    });
  }
};
