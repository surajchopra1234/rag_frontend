// Import modules
import { useState, useEffect } from "react";
import { Dropzone } from "@mantine/dropzone";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { LoadingOverlay, Modal } from "@mantine/core";
import { Link } from "react-router";

const PDFIcon = () => (
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.22217 0H18.6335L30 11.8141V34.7926C30 37.6712 27.6646 40 24.7878 40H5.22217C2.33544 40 8.24929e-10 37.6712 8.24929e-10 34.7926V5.20738C-5.06826e-05 2.32883 2.33539 0 5.22217 0Z"
            fill="#F23030"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.6234 0V11.7241H30L18.6234 0Z"
            fill="#FC7272"
        />
        <path
            d="M5.80353 29.845V22.5387H8.92081C9.69262 22.5387 10.3041 22.7486 10.7651 23.1784C11.2262 23.5982 11.4568 24.1679 11.4568 24.8775C11.4568 25.5872 11.2262 26.1569 10.7651 26.5767C10.3041 27.0065 9.69262 27.2164 8.92081 27.2164H7.6779V29.845H5.80353ZM7.6779 25.6272H8.71033C8.99096 25.6272 9.21148 25.5672 9.36186 25.4273C9.51219 25.2974 9.59242 25.1174 9.59242 24.8776C9.59242 24.6377 9.51224 24.4578 9.36186 24.3279C9.21153 24.1879 8.99101 24.128 8.71033 24.128H7.6779V25.6272ZM12.2285 29.845V22.5387H14.8246C15.3358 22.5387 15.8169 22.6086 16.2679 22.7586C16.719 22.9085 17.13 23.1184 17.4908 23.4083C17.8516 23.6881 18.1423 24.0679 18.3528 24.5477C18.5533 25.0275 18.6635 25.5772 18.6635 26.1969C18.6635 26.8066 18.5533 27.3563 18.3528 27.836C18.1423 28.3158 17.8516 28.6956 17.4908 28.9755C17.1299 29.2653 16.719 29.4752 16.2679 29.6251C15.8169 29.775 15.3358 29.845 14.8246 29.845H12.2285ZM14.0628 28.2559H14.6041C14.8947 28.2559 15.1654 28.2259 15.416 28.1559C15.6565 28.086 15.8871 27.976 16.1076 27.8261C16.3181 27.6762 16.4885 27.4662 16.6087 27.1864C16.729 26.9066 16.7892 26.5767 16.7892 26.1969C16.7892 25.8071 16.729 25.4772 16.6087 25.1974C16.4885 24.9176 16.3181 24.7077 16.1076 24.5577C15.8871 24.4078 15.6565 24.2978 15.416 24.2279C15.1654 24.1579 14.8947 24.1279 14.6041 24.1279H14.0628V28.2559ZM19.6058 29.845V22.5387H24.8179V24.1279H21.4801V25.2973H24.1463V26.8765H21.4801V29.845H19.6058Z"
            fill="white"
        />
    </svg>
);

const TXTIcon = () => (
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.22217 0H18.6335L30 11.8141V34.7926C30 37.6712 27.6645 40 24.7878 40H5.22217C2.33544 40 8.24928e-10 37.6712 8.24928e-10 34.7926V5.20738C-5.06826e-05 2.32883 2.33539 0 5.22217 0Z"
            fill="#257EFA"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.6235 0V11.7241H30L18.6235 0Z"
            fill="#539AFC"
        />
        <path
            d="M7.5776 29.2053V23.5182H5.49274V21.939H11.5168V23.5182H9.44199V29.2053H7.5776ZM18.2926 29.2053H16.3381L15.005 26.9764L13.6718 29.2053H11.7072L14.0227 25.3273L11.998 21.939H13.9525L15.005 23.6981L16.0474 21.939H18.012L15.9873 25.3373L18.2926 29.2053ZM20.5579 29.2053V23.5182H18.4831V21.939H24.5071V23.5182H22.4223V29.2053H20.5579Z"
            fill="white"
        />
    </svg>
);

const URLIcon = () => (
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M5.22217 0H18.6335L30 11.8141V34.7926C30 37.6712 27.6645 40 24.7878 40H5.22217C2.33544 40 8.24928e-10 37.6712 8.24928e-10 34.7926V5.20738C-5.06826e-05 2.32883 2.33539 0 5.22217 0Z"
            fill="#F0B70C"
        />
        <path d="M18.6235 0V11.7241H30L18.6235 0Z" fill="#F5CA49" />
        <path
            d="M11.7613 22V26.7852C11.7613 27.328 11.6464 27.7995 11.4145 28.1963C11.1851 28.5911 10.8522 28.8946 10.4198 29.1028C9.9894 29.3085 9.47763 29.4136 8.88913 29.4136C7.99958 29.4136 7.29616 29.1817 6.7844 28.7199C6.27263 28.2582 6.01187 27.6248 6 26.8213V22H7.77443V26.8573C7.79351 27.6561 8.16663 28.0577 8.8887 28.0577C9.25461 28.0577 9.52979 27.9572 9.71635 27.7562C9.90545 27.5552 9.99873 27.2275 9.99873 26.7755V22H11.7613ZM15.5781 26.7255H14.6237V29.3131H12.8611V22H15.738C16.6059 22 17.283 22.1938 17.7732 22.5762C18.2612 22.9612 18.505 23.5039 18.505 24.2073C18.505 24.7166 18.402 25.1376 18.1963 25.4725C17.9907 25.8075 17.6676 26.0776 17.23 26.2858L18.756 29.2368V29.3131H16.8692L15.5781 26.7255ZM14.6241 25.3695H15.7384C16.0734 25.3695 16.3269 25.2809 16.494 25.1066C16.6636 24.9298 16.7475 24.6835 16.7475 24.3676C16.7475 24.0517 16.664 23.8054 16.4914 23.626C16.3218 23.4467 16.0704 23.3559 15.738 23.3559H14.6237L14.6241 25.3695ZM21.3347 27.9572H24.4032V29.3131H19.5722V22H21.3347V27.9572Z"
            fill="white"
        />
    </svg>
);

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
};

const Data = () => {
    const [documents, setDocuments] = useState([]);
    const [url, setUrl] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isScraping, setIsScraping] = useState(false);

    const [opened, { open, close }] = useDisclosure(false);
    const [selectedDocumentUrls, setSelectedDocumentUrls] = useState([]);

    // Fetch the documents
    useEffect(() => {
        fetchDocuments().then();
    }, []);

    // Function to fetch documents from the API
    const fetchDocuments = async () => {
        setIsLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/documents", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`Failed to fetch documents: ${response.statusText}`);

            const data = await response.json();
            const formattedDocuments = data.documents.map((doc) => ({
                name: doc.file_name,
                type: doc.file_extension.substring(1),
                size: formatFileSize(doc.size),
                dateUploaded: new Date(doc.date).toISOString().split("T")[0],
                crawled_urls: doc?.crawled_urls ?? null
            }));

            setDocuments(formattedDocuments);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle the file drop
    const handleDrop = async (files) => {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", files[0]);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/documents", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error(`Failed to upload file: ${response.statusText}`);

            // Refresh the list to show the new document
            await fetchDocuments();
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    // Handle URL scraping
    const handleUrl = async () => {
        setIsScraping(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/documents/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error(`Failed to scrape URL: ${response.statusText}`);

            // Alert the user with the response message
            const data = await response.json();
            alert(data.message);

            // Clear the URL input
            setUrl("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsScraping(false);
        }
    };

    // Delete a document
    const deleteDocument = async (name, type) => {
        setIsDeleting(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/api/documents", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file_name: `${name}.${type}` })
            });

            if (!response.ok) throw new Error(`Failed to delete document: ${response.statusText}`);

            // Remove the deleted document from the state
            setDocuments((docs) => docs.filter((doc) => doc.name !== name || doc.type !== type));
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 sm:py-8">
            <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white sm:rounded-2xl sm:shadow-sm">
                <div className="space-y-5 p-5">
                    {/* Heading */}
                    <div className="flex items-center space-x-2">
                        <Link to="/" className="flex items-center justify-center p-2">
                            <ArrowLeft size={20} className="text-gray-950" />
                        </Link>

                        <h2 className="pb-[3px] text-base font-semibold text-gray-950">
                            Knowledge Base
                        </h2>
                    </div>

                    {/* Dropzone */}
                    <Dropzone
                        onDrop={handleDrop}
                        accept={{
                            "text/plain": [".txt"],
                            "application/pdf": [".pdf"]
                        }}
                        maxSize={5 * 1024 * 1024}
                        maxFiles={1}
                        disabled={isLoading}
                        classNames={{
                            root: "!border-dashed !rounded-lg !overflow-hidden !border-[1.5px] !border-gray-200 !hover:bg-gray-50 !data-accept:bg-green-50 !data-reject:bg-red-50"
                        }}>
                        <div
                            className="flex flex-col items-center justify-center gap-4"
                            style={{ minHeight: 150, pointerEvents: "none" }}>
                            {/* Accept state when a valid file is being dragged over */}
                            <Dropzone.Accept>
                                <div className="flex flex-col items-center justify-center space-y-3.5">
                                    <Upload size={36} className="text-green-500" />

                                    <div className="space-y-1 text-center">
                                        <h1 className="text-base font-semibold text-green-500">
                                            Drop files here
                                        </h1>

                                        <p className="text-[13px] font-normal text-gray-500">
                                            Release to upload the files
                                        </p>
                                    </div>
                                </div>
                            </Dropzone.Accept>

                            {/* Reject state when an invalid file is being dragged over */}
                            <Dropzone.Reject>
                                <div className="flex flex-col items-center justify-center space-y-3.5">
                                    <Upload size={36} className="text-red-500" />

                                    <div className="space-y-1 text-center">
                                        <h1 className="text-base font-semibold text-red-500">
                                            File rejected
                                        </h1>

                                        <p className="text-[13px] font-normal text-gray-500">
                                            Please upload only PDF or TXT files
                                        </p>
                                    </div>
                                </div>
                            </Dropzone.Reject>

                            {/* Idle state when no files are being dragged */}
                            <Dropzone.Idle>
                                <div className="flex flex-col items-center justify-center space-y-3.5">
                                    <Upload size={36} className="text-gray-500" />

                                    <div className="space-y-1 text-center">
                                        <h1 className="text-base font-semibold text-gray-950">
                                            Drop files here or click to select
                                        </h1>

                                        <p className="text-[13px] font-normal text-gray-500">
                                            PDF or TXT files only (max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </Dropzone.Idle>
                        </div>
                    </Dropzone>

                    {/* URL Scraper Input */}
                    <div className="flex items-center space-x-2 pt-1.5">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter a URL to scrape and add to knowledge base"
                            className="flex-1 rounded-lg px-3.5 py-2.5 !text-sm font-normal text-gray-950 placeholder-gray-400 ring-1 ring-gray-200 focus:ring-gray-300 focus:outline-none"
                            disabled={isLoading}
                        />

                        <button
                            onClick={handleUrl}
                            disabled={!url.trim() || isLoading}
                            className="flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 !text-sm !font-semibold text-gray-800 disabled:opacity-50">
                            Scrape URL
                        </button>
                    </div>

                    {/* Uploaded files list */}
                    {isLoading ? (
                        <p className="py-6 text-center text-sm font-normal text-gray-500">
                            Loading documents...
                        </p>
                    ) : documents.length === 0 ? (
                        <p className="py-6 text-center text-sm font-normal text-gray-500">
                            No documents uploaded yet
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 pt-1.5">
                            {documents.map((document) => (
                                <div key={document.name} className="col-span-1">
                                    <div className="flex items-center space-x-4 rounded-lg p-3.5 ring ring-gray-200">
                                        {/* File Icon */}
                                        <div>
                                            {document.type === "pdf" ? (
                                                <PDFIcon />
                                            ) : document.type === "txt" &&
                                              document.crawled_urls === null ? (
                                                <TXTIcon />
                                            ) : (
                                                <URLIcon />
                                            )}
                                        </div>

                                        {/* File Details */}
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <div className="flex items-center space-x-2">
                                                {document.crawled_urls === null ? (
                                                    <p className="block truncate text-sm font-medium text-gray-950 capitalize">
                                                        {document.name}
                                                    </p>
                                                ) : (
                                                    <p className="block truncate text-sm font-medium text-gray-950">
                                                        {document.name.split("_").join(".")}
                                                    </p>
                                                )}

                                                {document.crawled_urls !== null && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDocumentUrls(
                                                                document.crawled_urls
                                                            );
                                                            open();
                                                        }}
                                                        className="cursor-pointer rounded-xl bg-gray-100 px-2 py-1.5 !text-[11px] !leading-none !font-medium !text-gray-500 hover:bg-gray-200/80">
                                                        URLs
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-1.5">
                                                <span className="text-xs font-normal text-gray-500">
                                                    {document.size}
                                                </span>
                                                <span className="text-xs font-normal text-gray-500">
                                                    •
                                                </span>
                                                <span className="text-xs font-normal text-gray-500">
                                                    {document.dateUploaded}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            className="rounded-md bg-red-100/55 p-2 text-red-500 hover:bg-red-100"
                                            onClick={() =>
                                                deleteDocument(document.name, document.type)
                                            }>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading overlay */}
                    <LoadingOverlay
                        visible={isUploading || isDeleting || isScraping}
                        zIndex={1000}
                        overlayProps={{ radius: "sm", blur: 2 }}
                        loaderProps={{ color: "gray", type: "bars" }}
                    />

                    {/* Modal for displaying crawled URLs */}
                    <Modal opened={opened} onClose={close} title="Scraped URLs" centered size="xl">
                        <div className="space-y-2 overflow-hidden p-2">
                            {selectedDocumentUrls && selectedDocumentUrls.length > 0 ? (
                                selectedDocumentUrls.map((crawledUrl, index) => (
                                    <a
                                        key={index}
                                        href={crawledUrl}
                                        target="_blank"
                                        className="flex items-center space-x-3 rounded-md p-2 !text-sm !font-normal text-gray-700 hover:bg-gray-100">
                                        <span className="font-medium text-gray-500">
                                            {index + 1}.
                                        </span>
                                        <span className="truncate">{crawledUrl}</span>
                                    </a>
                                ))
                            ) : (
                                <p className="text-center text-sm font-normal text-gray-500">
                                    No URLs were crawled for this document.
                                </p>
                            )}
                        </div>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default Data;
