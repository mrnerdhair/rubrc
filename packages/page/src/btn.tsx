export const RunButton = (props: {
  callback: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        console.log("run button clicked");
        props.callback();
      }}
      class="text-2xl text-green-700"
    >
      Compile and Run
    </button>
  );
};

export const DownloadButton = (props: { callback: () => void }) => {
  return (
    <button
      type="button"
      onClick={() => {
        console.log("download button clicked");
        props.callback();
      }}
      class="text-2xl text-green-700"
    >
      Download file
    </button>
  );
};
