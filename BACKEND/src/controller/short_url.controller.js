export const createShortUrl = async    (req,res)=>{
  const {url} = req.body
  const shortUrl= generateNanoId(7)
  const newUrl = new urlSchema({
    full_url: url,
    short_url: shortUrl
  })
 newUrl.save()
  res.send(nanoid(7));
}