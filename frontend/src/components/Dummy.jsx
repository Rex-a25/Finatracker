import React, { useState, useEffect } from "react";

const Dummy = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let unit = await fetch("https://dummyjson.com/products");
        let data = await unit.json();
        setProducts(data.products); 
      } catch (error) {
        console.log("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []); 

  return (
    <div>
      <h2>Product Titles</h2>
      {products.length > 0 ? (
        products.map((p) => <p key={p.id}> {p.title}</p>)
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dummy;
