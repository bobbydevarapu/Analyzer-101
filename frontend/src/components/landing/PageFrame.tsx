const PageFrame = () => {
  const cls = "fixed h-8 w-8 z-30 pointer-events-none border-border hidden md:block";

  return (
    <>
      <div className={`${cls} top-3 left-3 border-l border-t`} />
      <div className={`${cls} top-3 right-3 border-r border-t`} />
      <div className={`${cls} bottom-3 left-3 border-l border-b`} />
      <div className={`${cls} bottom-3 right-3 border-r border-b`} />
    </>
  );
};

export default PageFrame;
