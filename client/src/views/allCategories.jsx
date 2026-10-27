import React from "react";
import { Title } from "../components/Layout";
import { ActionButton } from "../components/Buttons";
import {
  toCurrency,
  dateToMonthStr,
  monthWindow,
} from "../utils/helpers";

// averages use the same six months as the dashboard chart: this month and
// the five before it, all people combined
const AVERAGE_MONTHS = 6;

function monthlyAverages(months = []) {
  const labels = new Set(monthWindow(dateToMonthStr(new Date()), AVERAGE_MONTHS));
  const totals = {};
  months
    .filter((month) => labels.has(month.label))
    .forEach((month) => {
      [...month.expenseCategories, ...month.incomeCategories].forEach(
        ({ categoryID, total }) => {
          totals[categoryID] = (totals[categoryID] || 0) + (total || 0);
        }
      );
    });
  return Object.fromEntries(
    Object.entries(totals).map(([id, total]) => [id, total / AVERAGE_MONTHS])
  );
}

const CategoryList = ({ title, type, categories, averages, onSelect, onAdd }) => {
  const list = categories
    .filter((category) => category.categoryType === type)
    .sort((a, b) => (averages[b._id] || 0) - (averages[a._id] || 0));

  return (
    <>
      <div className="category-list-head noselect">
        <h4>{title}</h4>
        <span>Avg / month · last {AVERAGE_MONTHS} months</span>
      </div>
      <ul className="section-list">
        {list.length === 0 ? (
          <li className="flex-center" onClick={onAdd}>
            Click to add {type} categories
          </li>
        ) : (
          list.map((category) => (
            <li key={category._id} onClick={() => onSelect(category)}>
              <span className="f1 noselect">{category.title}</span>
              <span className="category-average noselect">
                {toCurrency(averages[category._id] || 0)}
                <span className="category-average-unit">/mo</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </>
  );
};

const AllCategories = ({
  categories,
  months,
  setPageState,
  setEditingModal,
  setEditingTransaction,
}) => {
  const averages = monthlyAverages(months);

  const setAsEditing = (entry) => {
    setEditingModal(true);
    return setEditingTransaction(entry);
  };

  const setAdd = () => {
    setPageState("add-category");
  };

  return (
    <section className="full-container">
      <Title text={`Manage Categories`} />
      <CategoryList
        title="Expense categories"
        type="expense"
        categories={categories}
        averages={averages}
        onSelect={setAsEditing}
        onAdd={setAdd}
      />
      <CategoryList
        title="Income categories"
        type="income"
        categories={categories}
        averages={averages}
        onSelect={setAsEditing}
        onAdd={setAdd}
      />
      <ActionButton
        action={setAdd}
        text={"Add new category"}
        additionalClass={"large-button"}
      />
    </section>
  );
};

export default AllCategories;
