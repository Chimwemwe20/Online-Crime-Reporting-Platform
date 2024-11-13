import { ethers } from 'ethers';
import axios from 'axios';
import AdminManagerABI from './artifacts/AdminManager.json';
import UserManagerABI from './artifacts/UserManager.json';
import CrimeReportABI from './artifacts/CrimeReport.json';

const ADMIN_MANAGER_ADDRESS = import.meta.env.VITE_ADMIN_MANAGER_ADDRESS;
const USER_MANAGER_ADDRESS = import.meta.env.VITE_USER_MANAGER_ADDRESS;
const CRIME_REPORT_ADDRESS = import.meta.env.VITE_CRIME_REPORT_ADDRESS;
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

let provider, signer, adminManager, userManager, crimeReport;
let requestPending = false;

export const initialize = async () => {
    if (!ADMIN_MANAGER_ADDRESS || !USER_MANAGER_ADDRESS || !CRIME_REPORT_ADDRESS) {
        console.error("Contract addresses are missing in environment variables.");
        return false;
    }

    if (window.ethereum) {
        if (requestPending) {
            console.log("MetaMask request is already in progress.");
            return false;
        }
        requestPending = true;

        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();

            await window.ethereum.request({ method: 'eth_requestAccounts' });

            adminManager = new ethers.Contract(ADMIN_MANAGER_ADDRESS, AdminManagerABI, signer);
            userManager = new ethers.Contract(USER_MANAGER_ADDRESS, UserManagerABI, signer);
            crimeReport = new ethers.Contract(CRIME_REPORT_ADDRESS, CrimeReportABI, signer);

            console.log("Contracts initialized successfully.");
            return true;
        } catch (error) {
            console.error("Error initializing contracts:", error.message);
            return false;
        } finally {
            requestPending = false;
        }
    } else {
        console.error("Please install MetaMask!");
        return false;
    }
};

const uploadToPinata = async (data, retries = 3) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    let formData = new FormData();
    formData.append('file', new Blob([data]));

    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
    };

    for (let i = 0; i < retries; i++) {
        try {
            const res = await axios.post(url, formData, config);
            console.log('Uploaded to Pinata:', res.data);
            return res.data.IpfsHash;
        } catch (error) {
            console.error(`Pinata upload attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
        }
    }
};

const uploadToIPFS = async (data) => {
    try {
        return await uploadToPinata(data);
    } catch (error) {
        console.error("Error uploading to Pinata:", error.message);
        throw new Error("IPFS upload failed");
    }
};

export const getOwner = async () => {
    try {
        return await adminManager.owner();
    } catch (error) {
        console.error("Error fetching owner:", error.message);
        throw new Error("Failed to fetch owner address");
    }
};

export const isAdmin = async (address) => {
    try {
        const owner = await getOwner();
        if (address === owner) {
            return true;
        }
        return await adminManager.isAdmin(address);
    } catch (error) {
        console.error("Error checking admin status:", error.message);
        return false;
    }
};

export const registerUser = async () => {
    try {
        const tx = await userManager.registerUser();
        await tx.wait();
        console.log('User registered successfully');
    } catch (error) {
        console.error("Error registering user:", error.message);
        throw new Error("User registration failed");
    }
};

export const reportCrime = async (name, description, location, isAnonymous, media) => {
    try {
        let mediaHash = '';
        if (media) {
            const mediaBuffer = await media.arrayBuffer();
            mediaHash = await uploadToIPFS(new Blob([mediaBuffer]));
        }

        const reportDetails = JSON.stringify({
            name: isAnonymous ? 'Anonymous' : name,
            description,
            isAnonymous
        });
        const reportHash = await uploadToIPFS(new Blob([reportDetails], { type: 'application/json' }));

        const tx = await crimeReport.reportCrime(reportHash, location, mediaHash);
        await tx.wait();
        console.log('Crime reported successfully');
        return tx.hash;
    } catch (error) {
        console.error("Error reporting crime:", error.message);
        throw new Error("Crime report failed: " + error.message);
    }
};

export const getReport = async (reportId) => {
    try {
        const [ipfsHash, location, mediaIpfsHash, reporter, timestamp, resolved, resolvedBy, resolutionIpfsHash] = 
            await crimeReport.getReport(reportId);
        
        // Fetch the report data from IPFS
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        if (!response.ok) throw new Error("Failed to fetch IPFS data");
        const reportData = await response.json();

        // Fetch media if available
        let mediaUrl = '';
        if (mediaIpfsHash && mediaIpfsHash !== '') {
            mediaUrl = `https://gateway.pinata.cloud/ipfs/${mediaIpfsHash}`;
        }

        // Fetch resolution details if available
        let resolutionDetails = '';
        if (resolved && resolutionIpfsHash !== '') {
            try {
                const resolutionResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${resolutionIpfsHash}`);
                if (resolutionResponse.ok) {
                    resolutionDetails = await resolutionResponse.text();
                }
            } catch (error) {
                console.error("Error fetching resolution details:", error);
            }
        }

        return {
            id: Number(reportId),
            ipfsHash,
            location,
            mediaIpfsHash,
            reporter,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            resolved,
            resolvedBy,
            resolutionIpfsHash,
            resolutionDetails,
            ...reportData,
            mediaUrl
        };
    } catch (error) {
        console.error("Error fetching report:", error.message);
        throw new Error("Failed to retrieve report details: " + error.message);
    }
};

export const resolveCase = async (reportId, resolutionMessage) => {
    try {
        const resolutionIpfsHash = await uploadToIPFS(new Blob([resolutionMessage], { type: 'text/plain' }));
        const tx = await crimeReport.resolveCase(reportId, resolutionIpfsHash);
        await tx.wait();
        console.log('Case resolved successfully');
        return tx.hash;
    } catch (error) {
        console.error("Error resolving case:", error.message);
        throw new Error("Case resolution failed: " + error.message);
    }
};

export const isRegistered = async (userAddress) => {
    try {
        return await userManager.isRegisteredUser(userAddress);
    } catch (error) {
        console.error("Error checking registration status:", error.message);
        return false;
    }
};

export const deregisterUser = async (userAddress) => {
    try {
        const tx = await userManager.deregisterUser(userAddress);
        await tx.wait();
        console.log('User deregistered successfully');
    } catch (error) {
        console.error("Error deregistering user:", error.message);
        throw new Error("User deregistration failed");
    }
};

export const addAdmin = async (adminAddress, name) => {
    try {
        const adminCID = await uploadToIPFS(name);
        const tx = await adminManager.addAdmin(adminAddress, adminCID);
        await tx.wait();
        console.log('Admin added successfully');
    } catch (error) {
        console.error("Error adding admin:", error.message);
        throw new Error("Admin addition failed");
    }
};

export const getUserReports = async (userAddress) => {
    try {
        const reportIds = await crimeReport.getReportIdsByUser(userAddress);
        const reports = await Promise.all(reportIds.map(async (reportId) => {
            const report = await getReport(Number(reportId));
            return report;
        }));
        return reports;
    } catch (error) {
        console.error("Error fetching user reports:", error.message);
        throw new Error("Failed to retrieve user reports");
    }
};

export const getReportCount = async () => {
    try {
        return await crimeReport.reportCount();
    } catch (error) {
        console.error("Error getting report count:", error.message);
        throw new Error("Failed to get report count: " + error.message);
    }
};

export const getReportIdsByUser = async (userAddress) => {
    try {
        return await crimeReport.getReportIdsByUser(userAddress);
    } catch (error) {
        console.error("Error getting user report IDs:", error.message);
        throw new Error("Failed to get user report IDs: " + error.message);
    }
};

export const checkIPFSStatus = async () => {
    try {
        const testData = new Blob(['IPFS Test Data'], { type: 'text/plain' });
        const hash = await uploadToIPFS(testData);
        return { status: 'OK', hash };
    } catch (error) {
        return { status: 'Error', message: error.message };
    }
};

export { crimeReport };

window.onunhandledrejection = (event) => {
    console.error("Unhandled promise rejection:", event.reason);
};

export default {
    initialize,
    getOwner,
    isAdmin,
    registerUser,
    reportCrime,
    getReport,
    resolveCase,
    isRegistered,
    deregisterUser,
    addAdmin,
    getUserReports,
    getReportCount,
    getReportIdsByUser,
    checkIPFSStatus,
};