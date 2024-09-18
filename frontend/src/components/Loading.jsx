import LoadingStyles from "../css-modules/Loading.module.css";

export default function Loading() {
  return (
    <span className={LoadingStyles["loading"]}>
      <img src="./loading-icon.svg" />
    </span>
  );
}
