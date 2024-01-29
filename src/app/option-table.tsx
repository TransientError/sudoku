import OptionCell from "./option-cell";

export default function OptionTable({
  sx,
  sy,
}: OptionTableProps) {
  return (
    <div className="table w-full h-full aspect-square">
      {Array.from({ length: 3 }, (_, oy) => (
        <div className="table-row h-1/3" key={oy}>
          {Array.from({ length: 3 }, (_, ox) => (
            <OptionCell key={ox} sx={sx} sy={sy} ox={ox} oy={oy} />
          ))}
        </div>
      ))}
    </div>
  );
}

type OptionTableProps = {
  sx: number;
  sy: number;
};
