import { CSSProperties, useRef } from "react"
import { ReactNode, useEffect, useState } from "react"
import ItemCard from "./ItemCard"

declare global {
    interface Window{
        gapi:any
    }
}
type ItemsContainerProps = { //fix expansion issues
    items?: {}[] 
    cards?: ReactNode[]
    setUpdateSignaller: () => void

    //From itemcard
    handleDialogOpen: (cardID?:number) => void;
    handleRetractDialogOpen: (cardID?:number) => void;
    updateSignal:boolean

    currentTopBid?:number
    currentCard?:number
    setCurrentTopBid: (bid?:number) => void
}
const styles = {
    row:{
        display:"flex",
        flexDirection: "row",
        justifyContent: "center",
        overflow:"hidden",
        marginRight:"auto",
        flexWrap:"wrap"
    } as CSSProperties
}

const ItemsContainer = (props: ItemsContainerProps):JSX.Element => {

    const [items, setItems] = useState<any[]>([])
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    //Socket for updating the top bid for all users.
    const socket = useRef<WebSocket>()
    useEffect(() => {
        try {
            socket.current = new WebSocket(`wss://${process.env.REACT_APP_API_URL}/websocket`)
        } catch(error) {
            return console.error(error)
        }
        socket.current.onopen = () => console.log('connected')
        socket.current.onclose = () => console.log('Connection closed')
        socket.current.onmessage = (event:MessageEvent) => {
            props.setUpdateSignaller()
            console.log('Message received', event)  
        }
        return () => {
            socket.current?.removeEventListener('open', () => console.log('connected'))
            socket.current?.removeEventListener('close', () => console.log('Connection closed'))
            socket.current?.removeEventListener('message', (event:MessageEvent) => {
                props.setUpdateSignaller()
                console.log('Message received', event)  
            })
            socket.current?.close()
        } 
        
        
    }, [])

    const useDocsAPI = async ():Promise<void> => {
        useEffect(() => {
            window.gapi.load('client:auth2', async () => {
                window.gapi.client.init({
                    apiKey:process.env.REACT_APP_GAPI_KEY,
                    clientId:process.env.REACT_APP_CLIENT_ID,
                    scope:process.env.REACT_APP_GAPI_SCOPES
                })
                .then(() => window.gapi.client.load('docs'))
                .then(() => {
                   console.log(window.gapi.auth2.getAuthInstance().isSignedIn) 
                })
                .then(async () => {
                    const res = await window.gapi.client.docs.documents.get({
                        documentId:process.env.REACT_APP_DOC_ID
                    })
                    console.log(res)
                })
            })
        },[])
    }
    //useDocsAPI()
    useEffect(() => {
        const getItems = async ():Promise<void> => {
            try{
                const res = await fetch(`https://${process.env.REACT_APP_API_URL}/users/getprices`, {
                    method: 'GET', 
                    mode:'cors',
                    headers:{
                        "Access-Control-Allow-Origin": "*"
                    }
                })
                //const currentTopbid:Response = await fetch(`https://${process.env.REACT_APP_API_URL}/users/gethighestbid?id=${props.currentCard ? props.currentCard:2}`)
                const data = await res.json()
                console.log(data)
               // props.setCurrentTopBid((await currentTopbid.json()).price)
                setItems(data) 
            } catch(err) {
                console.log("Could not get items" + err)
            } 
        }
        getItems()
    }, [props.updateSignal, /* props.currentCard */]) //updateSignal is not necessary, but I'm lazy
    useEffect(() => {
        try {
            const getTopBid = async ():Promise<void> => {
                const currentTopbid:Response = await fetch(`https://${process.env.REACT_APP_API_URL}/users/gethighestbid?id=${props.currentCard ? props.currentCard:2}`, {method:'GET',mode:'cors'})
                try {
                    const price:any = (await currentTopbid.json()).price
                    props.setCurrentTopBid(price)
                } catch {
                    props.setCurrentTopBid(undefined)
                }
    
            }
            getTopBid()
        } catch(err) {
            console.log(err)
        }
    }, [props.currentCard, props.updateSignal]) 
    
    return (
        <div style={styles.row}>

            {items.map(item =>
                //console.log(`${item.id} \n ${item.name} \n ${item.startingPrice} \n ${item.description} ${item.highestBid} \n\n`)
                <ItemCard 
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    key={item.id}
                    id={item.id}
                    handleDialogOpen={props.handleDialogOpen} 
                    handleRetractDialogOpen={props.handleRetractDialogOpen} 
                    itemName={item.name} 
                    topBid={item.highestBid} 
                    startingPrice={item.startingPrice} 
                    description={item.description}
                    imageName={item.image}
                    name={item.name}
                    highestBidder={item.highestBidder}
                />
            
            )}
            {/*  <ItemCard 
             isExpanded={isExpanded}
             setIsExpanded={setIsExpanded} 
            handleDialogOpen={props.handleDialogOpen} 
            handleRetractDialogOpen={props.handleRetractDialogOpen} 
            name={"Name"}
            />
             <ItemCard  
             isExpanded={isExpanded}
             setIsExpanded={setIsExpanded}
            handleDialogOpen={props.handleDialogOpen} 
            handleRetractDialogOpen={props.handleRetractDialogOpen} 
            name={"Name"}
            />
             <ItemCard  
             isExpanded={isExpanded}
             setIsExpanded={setIsExpanded}
            handleDialogOpen={props.handleDialogOpen} 
            handleRetractDialogOpen={props.handleRetractDialogOpen} 

            name={"Name"}
            />
             <ItemCard  
             isExpanded={isExpanded}
             setIsExpanded={setIsExpanded}
            handleDialogOpen={props.handleDialogOpen} 
            handleRetractDialogOpen={props.handleRetractDialogOpen} 
            name={"Name"}
            />
             <ItemCard  
             isExpanded={isExpanded}
             setIsExpanded={setIsExpanded}
            handleDialogOpen={props.handleDialogOpen} 
            handleRetractDialogOpen={props.handleRetractDialogOpen} 
            name={"Name"}
            />  */}
        </div>
    )
}
export default ItemsContainer
